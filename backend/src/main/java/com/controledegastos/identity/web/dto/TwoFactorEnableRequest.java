package com.controledegastos.identity.web.dto;

import jakarta.validation.constraints.NotBlank;

public record TwoFactorEnableRequest(@NotBlank(message = "obrigatório") String code) {
}
