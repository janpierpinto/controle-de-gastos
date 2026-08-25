package com.controledegastos.budgets.web.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record UpdateBudgetRequest(
        @NotNull(message = "obrigatório") @DecimalMin(value = "0.01", message = "deve ser positivo") BigDecimal plannedAmount,
        @Min(1) @Max(100) short alertThresholdPct) {
}
