package com.controledegastos.bills;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * status is one of "PAID", "OVERDUE", "PENDING" — plain strings (rather than
 * exposing the internal BillStatus enum) so callers outside this module
 * don't take a compile-time dependency on it.
 */
public record BillRecord(UUID id, String description, BigDecimal amount, LocalDate dueDate, String status) {
}
