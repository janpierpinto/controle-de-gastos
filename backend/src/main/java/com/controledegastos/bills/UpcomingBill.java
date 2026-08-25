package com.controledegastos.bills;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record UpcomingBill(UUID id, String description, BigDecimal amount, LocalDate dueDate, long daysUntilDue, boolean overdue) {
}
