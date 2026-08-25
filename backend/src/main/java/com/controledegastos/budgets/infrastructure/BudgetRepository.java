package com.controledegastos.budgets.infrastructure;

import com.controledegastos.budgets.domain.Budget;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BudgetRepository extends JpaRepository<Budget, UUID> {

    List<Budget> findByMonthReference(LocalDate monthReference);

    Optional<Budget> findByCategoryIdAndMonthReference(UUID categoryId, LocalDate monthReference);
}
