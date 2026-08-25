package com.controledegastos.bills.web.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

public record BillRequest(
        @NotBlank(message = "obrigatório") String description,
        @NotNull(message = "obrigatório") @DecimalMin(value = "0.01", message = "deve ser positivo") BigDecimal amount,
        @NotNull(message = "obrigatório") LocalDate dueDate,
        boolean recurring,
        @Min(0) @Max(30) short reminderDaysBefore) {
}
