package com.controledegastos.identity.web.dto;

import jakarta.validation.constraints.NotBlank;

public record TwoFactorDisableRequest(@NotBlank(message = "obrigatório") String password) {
}
