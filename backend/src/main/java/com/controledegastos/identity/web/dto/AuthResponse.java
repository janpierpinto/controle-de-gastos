package com.controledegastos.identity.web.dto;

import com.controledegastos.identity.application.AuthResult;
import com.controledegastos.identity.application.LoginOutcome;
import java.util.UUID;

public record AuthResponse(
        String accessToken, String refreshToken, UUID tenantId, String role, boolean mfaRequired, String mfaToken) {

    public static AuthResponse from(AuthResult result) {
        return new AuthResponse(result.accessToken(), result.refreshToken(), result.tenantId(), result.role(), false, null);
    }

    public static AuthResponse from(LoginOutcome outcome) {
        return switch (outcome) {
            case LoginOutcome.Success success -> from(success.tokens());
            case LoginOutcome.MfaRequired mfaRequired -> new AuthResponse(null, null, null, null, true, mfaRequired.mfaToken());
        };
    }
}
