package com.controledegastos.identity.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "obrigatório") String tenantName,
        @NotBlank(message = "obrigatório") @Email(message = "e-mail inválido") String email,
        @NotBlank(message = "obrigatório") @Size(min = 8, message = "mínimo 8 caracteres") String password,
        @NotBlank(message = "obrigatório") String name) {
}
