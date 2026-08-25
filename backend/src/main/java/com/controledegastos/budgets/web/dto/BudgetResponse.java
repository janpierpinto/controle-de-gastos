package com.controledegastos.budgets.web.dto;

import com.controledegastos.budgets.application.BudgetProgress;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.UUID;

public record BudgetResponse(
        UUID id,
        UUID categoryId,
        LocalDate monthReference,
        BigDecimal plannedAmount,
        short alertThresholdPct,
        BigDecimal spentAmount,
        int percentageUsed,
        boolean alertTriggered,
        boolean exceeded) {

    public static BudgetResponse from(BudgetProgress progress) {
        var budget = progress.budget();
        var spent = progress.spentAmount();
        var percentageUsed = budget.getPlannedAmount().signum() == 0
                ? 0
                : spent.multiply(BigDecimal.valueOf(100))
                        .divide(budget.getPlannedAmount(), 0, RoundingMode.HALF_UP)
                        .intValue();

        return new BudgetResponse(
                budget.getId(),
                budget.getCategoryId(),
                budget.getMonthReference(),
                budget.getPlannedAmount(),
                budget.getAlertThresholdPct(),
                spent,
                percentageUsed,
                percentageUsed >= budget.getAlertThresholdPct(),
                spent.compareTo(budget.getPlannedAmount()) > 0);
    }
}
