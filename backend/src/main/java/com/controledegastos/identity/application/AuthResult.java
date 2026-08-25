package com.controledegastos.identity.application;

import java.util.UUID;

public record AuthResult(String accessToken, String refreshToken, UUID tenantId, String role) {
}
