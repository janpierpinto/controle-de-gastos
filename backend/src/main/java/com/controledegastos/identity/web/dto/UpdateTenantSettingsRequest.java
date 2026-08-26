package com.controledegastos.identity.web.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateTenantSettingsRequest(@NotBlank(message = "obrigatório") String currency) {
}
