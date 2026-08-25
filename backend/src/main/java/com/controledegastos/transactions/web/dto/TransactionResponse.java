package com.controledegastos.transactions.web.dto;

import com.controledegastos.transactions.domain.Transaction;
import com.controledegastos.transactions.domain.TransactionOrigin;
import com.controledegastos.transactions.domain.TransactionType;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record TransactionResponse(
        UUID id,
        UUID categoryId,
        String description,
        BigDecimal amount,
        LocalDate occurredOn,
        TransactionType type,
        TransactionOrigin origin,
        boolean recurring,
        String notes) {

    public static TransactionResponse from(Transaction transaction) {
        return new TransactionResponse(
                transaction.getId(),
                transaction.getCategoryId(),
                transaction.getDescription(),
                transaction.getAmount(),
                transaction.getOccurredOn(),
                transaction.getType(),
                transaction.getOrigin(),
                transaction.isRecurring(),
                transaction.getNotes());
    }
}
