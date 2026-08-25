package com.controledegastos.budgets;

import java.math.BigDecimal;
import java.util.UUID;

public record BudgetAlert(
        UUID categoryId, BigDecimal plannedAmount, BigDecimal spentAmount, int percentageUsed, boolean alertTriggered, boolean exceeded) {
}
