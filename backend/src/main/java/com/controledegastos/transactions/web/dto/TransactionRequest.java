package com.controledegastos.transactions.web.dto;

import com.controledegastos.transactions.domain.TransactionType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record TransactionRequest(
        UUID categoryId,
        @NotBlank(message = "obrigatório") String description,
        @NotNull(message = "obrigatório") @DecimalMin(value = "0.01", message = "deve ser positivo") BigDecimal amount,
        @NotNull(message = "obrigatório") LocalDate occurredOn,
        @NotNull(message = "obrigatório") TransactionType type,
        boolean recurring,
        String notes) {
}
