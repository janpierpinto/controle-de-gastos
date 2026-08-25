package com.controledegastos.categories.application;

import com.controledegastos.categories.domain.Category;
import com.controledegastos.categories.domain.CategoryType;
import com.controledegastos.categories.infrastructure.CategoryRepository;
import com.controledegastos.shared.tenancy.TenantContext;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @Transactional(readOnly = true)
    public List<Category> list() {
        return categoryRepository.findAllByOrderByTypeAscNameAsc();
    }

    @Transactional
    public Category create(String name, String icon, String color, CategoryType type) {
        var tenantId = TenantContext.get();
        var category = new Category(tenantId, name, icon, color, type);
        return categoryRepository.save(category);
    }
}
