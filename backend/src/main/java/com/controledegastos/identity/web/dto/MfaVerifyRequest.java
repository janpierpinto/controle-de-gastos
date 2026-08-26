package com.controledegastos.identity.web.dto;

import jakarta.validation.constraints.NotBlank;

public record MfaVerifyRequest(
        @NotBlank(message = "obrigatório") String mfaToken, @NotBlank(message = "obrigatório") String code) {
}
