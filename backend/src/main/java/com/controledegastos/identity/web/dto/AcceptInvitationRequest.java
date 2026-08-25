package com.controledegastos.identity.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AcceptInvitationRequest(
        @NotBlank(message = "obrigatório") String token,
        @NotBlank(message = "obrigatório") String name,
        @NotBlank(message = "obrigatório") @Size(min = 8, message = "mínimo 8 caracteres") String password) {
}
