package com.controledegastos.identity.security;

import dev.samstevens.totp.code.CodeVerifier;
import dev.samstevens.totp.code.DefaultCodeGenerator;
import dev.samstevens.totp.code.DefaultCodeVerifier;
import dev.samstevens.totp.code.HashingAlgorithm;
import dev.samstevens.totp.exceptions.QrGenerationException;
import dev.samstevens.totp.qr.QrData;
import dev.samstevens.totp.qr.QrGenerator;
import dev.samstevens.totp.qr.ZxingPngQrGenerator;
import dev.samstevens.totp.secret.DefaultSecretGenerator;
import dev.samstevens.totp.secret.SecretGenerator;
import dev.samstevens.totp.time.SystemTimeProvider;
import org.springframework.stereotype.Component;

/**
 * Thin wrapper around the samstevens/java-totp library — everything TOTP
 * (RFC 6238) related lives here so both AuthService (verifying a code at
 * login) and TwoFactorService (setup/enable) share one implementation
 * instead of each wiring the library separately.
 */
@Component
public class TotpService {

    private static final String ISSUER = "JPDigital - Controle de Gastos";

    private final SecretGenerator secretGenerator = new DefaultSecretGenerator();
    private final QrGenerator qrGenerator = new ZxingPngQrGenerator();
    private final CodeVerifier codeVerifier = new DefaultCodeVerifier(new DefaultCodeGenerator(), new SystemTimeProvider());

    public String generateSecret() {
        return secretGenerator.generate();
    }

    public boolean verifyCode(String secret, String code) {
        return secret != null && code != null && codeVerifier.isValidCode(secret, code);
    }

    public byte[] generateQrPng(String secret, String accountLabel) {
        var data = new QrData.Builder()
                .label(accountLabel)
                .secret(secret)
                .issuer(ISSUER)
                .algorithm(HashingAlgorithm.SHA1)
                .digits(6)
                .period(30)
                .build();
        try {
            return qrGenerator.generate(data);
        } catch (QrGenerationException e) {
            throw new IllegalStateException("Falha ao gerar QR code do 2FA", e);
        }
    }
}
