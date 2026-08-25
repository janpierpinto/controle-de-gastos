package com.controledegastos.budgets.web.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record BudgetRequest(
        @NotNull(message = "obrigatório") UUID categoryId,
        @NotNull(message = "obrigatório") LocalDate monthReference,
        @NotNull(message = "obrigatório") @DecimalMin(value = "0.01", message = "deve ser positivo") BigDecimal plannedAmount,
        @Min(1) @Max(100) short alertThresholdPct) {
}
