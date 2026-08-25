package com.controledegastos.goals.web.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record ContributionRequest(
        @NotNull(message = "obrigatório") @DecimalMin(value = "0.01", message = "deve ser positivo") BigDecimal amount) {
}
