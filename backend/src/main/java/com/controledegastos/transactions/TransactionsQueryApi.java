package com.controledegastos.transactions;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * The transactions module's public surface for other modules (Spring
 * Modulith only treats types in a module's root package as "exposed" by
 * default — everything under transactions.domain/.infrastructure/.application
 * is internal and other modules are not allowed to depend on it directly).
 */
public interface TransactionsQueryApi {

    BigDecimal totalExpensesForCategoryInPeriod(UUID categoryId, LocalDate from, LocalDate to);
}
