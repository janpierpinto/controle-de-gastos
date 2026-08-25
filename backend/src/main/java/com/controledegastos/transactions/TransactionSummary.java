package com.controledegastos.transactions;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Lightweight, module-external view of a transaction — see
 * TransactionsQueryApi for why this lives in the module's root package.
 */
public record TransactionSummary(
        UUID id, UUID categoryId, String description, BigDecimal amount, LocalDate occurredOn, String type) {
}
