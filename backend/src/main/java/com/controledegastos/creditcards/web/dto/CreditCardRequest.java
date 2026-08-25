package com.controledegastos.creditcards.web.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;

public record CreditCardRequest(
        @NotBlank(message = "obrigatório") String name,
        String brand,
        @DecimalMin(value = "0.01", message = "deve ser positivo") BigDecimal creditLimit,
        @Min(1) @Max(31) short closingDay,
        @Min(1) @Max(31) short dueDay) {
}
