package com.controledegastos.categories.web.dto;

import com.controledegastos.categories.domain.CategoryType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateCategoryRequest(
        @NotBlank(message = "obrigatório") String name,
        String icon,
        String color,
        @NotNull(message = "obrigatório") CategoryType type) {
}
