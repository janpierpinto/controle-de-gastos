package com.controledegastos.goals.web.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

public record GoalRequest(
        @NotBlank(message = "obrigatório") String name,
        @NotNull(message = "obrigatório") @DecimalMin(value = "0.01", message = "deve ser positivo") BigDecimal targetAmount,
        LocalDate targetDate) {
}
