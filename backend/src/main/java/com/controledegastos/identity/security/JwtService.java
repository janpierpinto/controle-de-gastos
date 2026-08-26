package com.controledegastos.identity.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class JwtService {

    private static final String CLAIM_TENANT_ID = "tenantId";
    private static final String CLAIM_ROLE = "role";
    private static final String CLAIM_TYPE = "type";
    private static final String TYPE_ACCESS = "access";
    private static final String TYPE_REFRESH = "refresh";
    private static final String TYPE_MFA = "mfa";
    private static final Duration MFA_TTL = Duration.ofMinutes(5);

    private final SecretKey key;
    private final Duration accessTtl;
    private final Duration refreshTtl;

    public JwtService(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.access-token-ttl-minutes}") long accessTokenTtlMinutes,
            @Value("${app.jwt.refresh-token-ttl-days}") long refreshTokenTtlDays) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessTtl = Duration.ofMinutes(accessTokenTtlMinutes);
        this.refreshTtl = Duration.ofDays(refreshTokenTtlDays);
    }

    public String generateAccessToken(UUID userId, UUID tenantId, String role) {
        return buildToken(userId, tenantId, role, accessTtl, TYPE_ACCESS);
    }

    public String generateRefreshToken(UUID userId, UUID tenantId, String role) {
        return buildToken(userId, tenantId, role, refreshTtl, TYPE_REFRESH);
    }

    /**
     * Issued after a correct password when the account has MFA enabled,
     * instead of the real access/refresh tokens. Deliberately carries no
     * tenantId/role — which tenant/role to use is only resolved after the
     * TOTP code is verified (see AuthService.verifyMfa), same lookup login()
     * already does today.
     */
    public String generateMfaToken(UUID userId) {
        var now = Instant.now();
        return Jwts.builder()
                .subject(userId.toString())
                .claim(CLAIM_TYPE, TYPE_MFA)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(MFA_TTL)))
                .signWith(key)
                .compact();
    }

    public boolean isMfaToken(Claims claims) {
        return TYPE_MFA.equals(claims.get(CLAIM_TYPE, String.class));
    }

    public Claims parse(String token) {
        return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
    }

    public boolean isAccessToken(Claims claims) {
        return TYPE_ACCESS.equals(claims.get(CLAIM_TYPE, String.class));
    }

    public boolean isRefreshToken(Claims claims) {
        return TYPE_REFRESH.equals(claims.get(CLAIM_TYPE, String.class));
    }

    public UUID tenantIdOf(Claims claims) {
        return UUID.fromString(claims.get(CLAIM_TENANT_ID, String.class));
    }

    public String roleOf(Claims claims) {
        return claims.get(CLAIM_ROLE, String.class);
    }

    public UUID userIdOf(Claims claims) {
        return UUID.fromString(claims.getSubject());
    }

    private String buildToken(UUID userId, UUID tenantId, String role, Duration ttl, String type) {
        var now = Instant.now();
        return Jwts.builder()
                .subject(userId.toString())
                .claim(CLAIM_TENANT_ID, tenantId.toString())
                .claim(CLAIM_ROLE, role)
                .claim(CLAIM_TYPE, type)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(ttl)))
                .signWith(key)
                .compact();
    }
}
