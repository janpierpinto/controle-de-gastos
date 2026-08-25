package com.controledegastos.identity.web.dto;

import jakarta.validation.constraints.NotBlank;

public record RefreshRequest(@NotBlank(message = "obrigatório") String refreshToken) {
}
