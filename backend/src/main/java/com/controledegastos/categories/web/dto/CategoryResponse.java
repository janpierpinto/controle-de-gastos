package com.controledegastos.categories.web.dto;

import com.controledegastos.categories.domain.Category;
import com.controledegastos.categories.domain.CategoryType;
import java.util.UUID;

public record CategoryResponse(UUID id, String name, String icon, String color, CategoryType type, boolean global) {

    public static CategoryResponse from(Category category) {
        return new CategoryResponse(
                category.getId(),
                category.getName(),
                category.getIcon(),
                category.getColor(),
                category.getType(),
                category.isGlobal());
    }
}
