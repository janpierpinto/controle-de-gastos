package com.controledegastos.identity.web.dto;

import com.controledegastos.identity.application.AuthResult;
import java.util.UUID;

public record AuthResponse(String accessToken, String refreshToken, UUID tenantId, String role) {

    public static AuthResponse from(AuthResult result) {
        return new AuthResponse(result.accessToken(), result.refreshToken(), result.tenantId(), result.role());
    }
}
