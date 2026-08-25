package com.controledegastos.identity.application;

import com.controledegastos.identity.domain.MemberRole;
import com.controledegastos.identity.domain.Tenant;
import com.controledegastos.identity.domain.TenantMember;
import com.controledegastos.identity.domain.TenantType;
import com.controledegastos.identity.domain.User;
import com.controledegastos.identity.infrastructure.TenantMemberRepository;
import com.controledegastos.identity.infrastructure.TenantRepository;
import com.controledegastos.identity.infrastructure.UserRepository;
import com.controledegastos.identity.security.JwtService;
import com.controledegastos.shared.tenancy.TenantContext;
import com.controledegastos.shared.tenancy.UserContext;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * Registration creates a brand-new tenant (a family) with the signing-up
 * user as its OWNER. Joining an existing tenant via invitation is a
 * Fase 1 feature, not implemented yet.
 */
@Service
public class AuthService {

    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final TenantMemberRepository tenantMemberRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final TransactionTemplate transactionTemplate;

    public AuthService(
            TenantRepository tenantRepository,
            UserRepository userRepository,
            TenantMemberRepository tenantMemberRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            PlatformTransactionManager transactionManager) {
        this.tenantRepository = tenantRepository;
        this.userRepository = userRepository;
        this.tenantMemberRepository = tenantMemberRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.transactionTemplate = new TransactionTemplate(transactionManager);
    }

    /**
     * TenantAwareDataSource only stamps the Postgres session variables when a
     * connection is checked out. With plain @Transactional, Spring's proxy
     * begins the transaction (and Hibernate/JpaTransactionManager eagerly
     * acquires that connection) BEFORE the method body runs at all, so
     * setting TenantContext as the first line of the method is still too
     * late. Using TransactionTemplate instead means WE control exactly when
     * the transaction starts — after TenantContext is already set.
     */
    public AuthResult register(String tenantName, String email, String password, String name) {
        var tenant = new Tenant(tenantName, TenantType.FAMILY);
        TenantContext.set(tenant.getId());
        try {
            return transactionTemplate.execute(status -> {
                if (userRepository.existsByEmail(email)) {
                    throw new IllegalArgumentException("E-mail já cadastrado");
                }
                var savedTenant = tenantRepository.save(tenant);
                var user = userRepository.save(new User(email, passwordEncoder.encode(password), name));
                var member = tenantMemberRepository.save(new TenantMember(savedTenant, user, MemberRole.OWNER));
                return issueTokens(user.getId(), savedTenant.getId(), member.getRole());
            });
        } finally {
            TenantContext.clear();
        }
    }

    /**
     * Deliberately NOT @Transactional: the user id needed to set UserContext
     * is only known after the first query, so the two repository calls must
     * run as separate transactions (separate connection checkouts) for
     * UserContext to actually reach the second one. See the note on
     * {@link #register}.
     */
    public AuthResult login(String email, String password) {
        var user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadCredentialsException("Credenciais inválidas"));
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new BadCredentialsException("Credenciais inválidas");
        }

        // No tenant selected yet: rely on the tenant_members RLS clause that
        // exposes a user's own memberships via app.current_user.
        UserContext.set(user.getId());
        try {
            var memberships = tenantMemberRepository.findByUserIdOrderByJoinedAtDesc(user.getId());
            if (memberships.isEmpty()) {
                throw new BadCredentialsException("Usuário sem tenant associado");
            }
            // TODO(Fase 1): quando o usuário pertencer a múltiplos tenants, deixar o
            // cliente escolher em vez de assumir o vínculo mais recente.
            var membership = memberships.get(0);
            return issueTokens(user.getId(), membership.getTenant().getId(), membership.getRole());
        } finally {
            UserContext.clear();
        }
    }

    /**
     * Stateless refresh: trusts the refresh token's claims within its TTL.
     * TODO(Fase 2): back this with a revocable refresh-token store so a
     * compromised token (or a removed tenant member) can be invalidated
     * before it expires.
     */
    public AuthResult refresh(String refreshToken) {
        var claims = jwtService.parse(refreshToken);
        if (!jwtService.isRefreshToken(claims)) {
            throw new BadCredentialsException("Token de atualização inválido");
        }
        var userId = jwtService.userIdOf(claims);
        var tenantId = jwtService.tenantIdOf(claims);
        var role = jwtService.roleOf(claims);
        return issueTokens(userId, tenantId, role);
    }

    private AuthResult issueTokens(java.util.UUID userId, java.util.UUID tenantId, MemberRole role) {
        return issueTokens(userId, tenantId, role.name());
    }

    private AuthResult issueTokens(java.util.UUID userId, java.util.UUID tenantId, String role) {
        var accessToken = jwtService.generateAccessToken(userId, tenantId, role);
        var refreshToken = jwtService.generateRefreshToken(userId, tenantId, role);
        return new AuthResult(accessToken, refreshToken, tenantId, role);
    }
}
