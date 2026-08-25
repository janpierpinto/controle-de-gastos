package com.controledegastos.budgets.application;

import com.controledegastos.budgets.domain.Budget;
import java.math.BigDecimal;

public record BudgetProgress(Budget budget, BigDecimal spentAmount) {
}
