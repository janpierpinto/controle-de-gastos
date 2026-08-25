package com.controledegastos.categories.infrastructure;

import com.controledegastos.categories.domain.Category;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryRepository extends JpaRepository<Category, UUID> {

    /**
     * RLS (categories_select) already restricts rows to "global or my
     * tenant" — no need for an explicit tenant_id filter here, findAll()
     * naturally returns only what the current tenant is allowed to see.
     */
    List<Category> findAllByOrderByTypeAscNameAsc();
}
