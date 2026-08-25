package com.controledegastos.transactions.web.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.UUID;

public record SplitItem(
        @NotNull(message = "obrigatório") UUID tenantMemberId,
        @NotNull(message = "obrigatório") @DecimalMin(value = "0.01", message = "deve ser positivo") BigDecimal amount) {
}
