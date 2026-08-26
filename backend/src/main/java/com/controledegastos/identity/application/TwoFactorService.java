package com.controledegastos.identity.application;

import com.controledegastos.identity.infrastructure.UserRepository;
import com.controledegastos.identity.security.TotpService;
import com.controledegastos.shared.audit.AuditService;
import com.controledegastos.shared.tenancy.UserContext;
import java.util.Base64;
import java.util.NoSuchElementException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Self-service 2FA settings (setup/enable/disable) — an authenticated
 * "account security" action, same UserContext.get() pattern as
 * PrivacyService. The login-time verification step (spending the MFA
 * challenge token for real tokens) lives in AuthService.completeMfaLogin
 * instead, since that runs before the user has a session at all.
 */
@Service
public class TwoFactorService {

    private final UserRepository userRepository;
    private final TotpService totpService;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    public TwoFactorService(
            UserRepository userRepository, TotpService totpService, PasswordEncoder passwordEncoder, AuditService auditService) {
        this.userRepository = userRepository;
        this.totpService = totpService;
        this.passwordEncoder = passwordEncoder;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public boolean isEnabled() {
        return currentUser().isMfaEnabled();
    }

    @Transactional
    public TwoFactorSetup setup() {
        var user = currentUser();
        var secret = totpService.generateSecret();
        user.setPendingMfaSecret(secret);
        var qrPng = totpService.generateQrPng(secret, user.getEmail());
        return new TwoFactorSetup(secret, Base64.getEncoder().encodeToString(qrPng));
    }

    @Transactional
    public void enable(String code) {
        var user = currentUser();
        if (user.getMfaSecret() == null || !totpService.verifyCode(user.getMfaSecret(), code)) {
            throw new BadCredentialsException("Código inválido");
        }
        user.enableMfa();
        auditService.record("MFA_ENABLED", "USER", user.getId());
    }

    @Transactional
    public void disable(String password) {
        var user = currentUser();
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new BadCredentialsException("Senha inválida");
        }
        user.disableMfa();
        auditService.record("MFA_DISABLED", "USER", user.getId());
    }

    private com.controledegastos.identity.domain.User currentUser() {
        return userRepository.findById(UserContext.get()).orElseThrow(NoSuchElementException::new);
    }
}
