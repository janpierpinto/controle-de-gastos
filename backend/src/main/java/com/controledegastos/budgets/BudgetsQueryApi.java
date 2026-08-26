package com.controledegastos.budgets;

import java.time.LocalDate;
import java.util.List;

/**
 * The budgets module's public surface for other modules — see
 * TransactionsQueryApi for why this lives in the module's root package.
 */
public interface BudgetsQueryApi {

    List<BudgetAlert> currentMonthAlerts();

    List<BudgetAlert> alertsForMonth(LocalDate month);
}
