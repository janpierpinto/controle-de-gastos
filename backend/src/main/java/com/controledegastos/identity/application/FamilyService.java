package com.controledegastos.identity.application;

import com.controledegastos.identity.domain.Invitation;
import com.controledegastos.identity.domain.InvitationStatus;
import com.controledegastos.identity.domain.MemberRole;
import com.controledegastos.identity.domain.TenantMember;
import com.controledegastos.identity.domain.User;
import com.controledegastos.identity.infrastructure.InvitationRepository;
import com.controledegastos.identity.infrastructure.TenantMemberRepository;
import com.controledegastos.identity.infrastructure.TenantRepository;
import com.controledegastos.identity.infrastructure.UserRepository;
import com.controledegastos.identity.security.JwtService;
import com.controledegastos.shared.audit.AuditService;
import com.controledegastos.shared.tenancy.LookupSecretContext;
import com.controledegastos.shared.tenancy.TenantContext;
import com.controledegastos.shared.tenancy.UserContext;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FamilyService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final Duration INVITATION_TTL = Duration.ofDays(7);

    private final TenantRepository tenantRepository;
    private final TenantMemberRepository tenantMemberRepository;
    private final InvitationRepository invitationRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuditService auditService;

    public FamilyService(
            TenantRepository tenantRepository,
            TenantMemberRepository tenantMemberRepository,
            InvitationRepository invitationRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            AuditService auditService) {
        this.tenantRepository = tenantRepository;
        this.tenantMemberRepository = tenantMemberRepository;
        this.invitationRepository = invitationRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<TenantMember> listMembers() {
        return tenantMemberRepository.findAllWithUserOrderByJoinedAtAsc();
    }

    @Transactional(readOnly = true)
    public List<Invitation> listPendingInvitations() {
        return invitationRepository.findByStatusOrderByCreatedAtDesc(InvitationStatus.PENDING);
    }

    @Transactional
    public Invitation invite(String email, MemberRole role) {
        if (role == MemberRole.OWNER) {
            throw new IllegalArgumentException("Não é possível convidar como OWNER");
        }
        var token = generateToken();
        var invitation = new Invitation(TenantContext.get(), email, token, role, Instant.now().plus(INVITATION_TTL));
        var saved = invitationRepository.save(invitation);
        auditService.record("INVITE_CREATED", "INVITATION", saved.getId());
        return saved;
    }

    /**
     * Deliberately NOT @Transactional, same reasoning as AuthService.login:
     * LookupSecretContext must be set before the FIRST repository call, and
     * the tenant only becomes known once we've read the invitation, so each
     * step needs its own transaction/connection checkout.
     */
    public AuthResult acceptInvitation(String token, String name, String password) {
        LookupSecretContext.set(token);
        Invitation invitation;
        try {
            invitation = invitationRepository.findByToken(token).orElseThrow(NoSuchElementException::new);
        } finally {
            LookupSecretContext.clear();
        }

        if (!invitation.isAcceptable()) {
            throw new BadCredentialsException("Convite inválido ou expirado");
        }
        if (userRepository.existsByEmail(invitation.getEmail())) {
            throw new IllegalArgumentException("E-mail já cadastrado");
        }

        var user = userRepository.save(new User(invitation.getEmail(), passwordEncoder.encode(password), name));

        TenantContext.set(invitation.getTenantId());
        try {
            var tenant = tenantRepository.findById(invitation.getTenantId()).orElseThrow(NoSuchElementException::new);
            var member = tenantMemberRepository.save(new TenantMember(tenant, user, invitation.getRole()));
            invitation.markAccepted();
            invitationRepository.save(invitation);
            UserContext.set(user.getId());
            auditService.record("INVITE_ACCEPTED", "TENANT_MEMBER", member.getId());

            var accessToken = jwtService.generateAccessToken(user.getId(), tenant.getId(), member.getRole().name());
            var refreshToken = jwtService.generateRefreshToken(user.getId(), tenant.getId(), member.getRole().name());
            return new AuthResult(accessToken, refreshToken, tenant.getId(), member.getRole().name());
        } finally {
            TenantContext.clear();
            UserContext.clear();
        }
    }

    @Transactional
    public void removeMember(UUID tenantMemberId) {
        var member = tenantMemberRepository.findById(tenantMemberId).orElseThrow(NoSuchElementException::new);
        if (member.getRole() == MemberRole.OWNER) {
            throw new IllegalArgumentException("Não é possível remover o OWNER da família");
        }
        tenantMemberRepository.delete(member);
        auditService.record("MEMBER_REMOVED", "TENANT_MEMBER", tenantMemberId);
    }

    private String generateToken() {
        var bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
