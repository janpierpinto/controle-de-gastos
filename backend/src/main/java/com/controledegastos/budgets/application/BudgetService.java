package com.controledegastos.budgets.application;

import com.controledegastos.budgets.BudgetAlert;
import com.controledegastos.budgets.BudgetsQueryApi;
import com.controledegastos.budgets.domain.Budget;
import com.controledegastos.budgets.infrastructure.BudgetRepository;
import com.controledegastos.shared.tenancy.TenantContext;
import com.controledegastos.transactions.TransactionsQueryApi;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BudgetService implements BudgetsQueryApi {

    private final BudgetRepository budgetRepository;
    private final TransactionsQueryApi transactionsQueryApi;

    public BudgetService(BudgetRepository budgetRepository, TransactionsQueryApi transactionsQueryApi) {
        this.budgetRepository = budgetRepository;
        this.transactionsQueryApi = transactionsQueryApi;
    }

    @Transactional(readOnly = true)
    public List<BudgetProgress> list(LocalDate month) {
        var monthStart = month.withDayOfMonth(1);
        return budgetRepository.findByMonthReference(monthStart).stream()
                .map(budget -> new BudgetProgress(budget, spentInMonth(budget.getCategoryId(), monthStart)))
                .toList();
    }

    @Transactional
    public BudgetProgress create(UUID categoryId, LocalDate month, BigDecimal plannedAmount, short alertThresholdPct) {
        var monthStart = month.withDayOfMonth(1);
        if (budgetRepository.findByCategoryIdAndMonthReference(categoryId, monthStart).isPresent()) {
            throw new IllegalArgumentException("Já existe orçamento para essa categoria neste mês");
        }
        var budget = budgetRepository.save(new Budget(TenantContext.get(), categoryId, monthStart, plannedAmount, alertThresholdPct));
        return new BudgetProgress(budget, spentInMonth(categoryId, monthStart));
    }

    @Transactional
    public BudgetProgress update(UUID id, BigDecimal plannedAmount, short alertThresholdPct) {
        var budget = budgetRepository.findById(id).orElseThrow(NoSuchElementException::new);
        budget.update(plannedAmount, alertThresholdPct);
        return new BudgetProgress(budget, spentInMonth(budget.getCategoryId(), budget.getMonthReference()));
    }

    @Transactional
    public void delete(UUID id) {
        budgetRepository.delete(budgetRepository.findById(id).orElseThrow(NoSuchElementException::new));
    }

    private BigDecimal spentInMonth(UUID categoryId, LocalDate monthStart) {
        var monthEnd = YearMonth.from(monthStart).atEndOfMonth();
        return transactionsQueryApi.totalExpensesForCategoryInPeriod(categoryId, monthStart, monthEnd);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BudgetAlert> currentMonthAlerts() {
        return list(LocalDate.now()).stream()
                .map(progress -> {
                    var budget = progress.budget();
                    var spent = progress.spentAmount();
                    var percentageUsed = budget.getPlannedAmount().signum() == 0
                            ? 0
                            : spent.multiply(BigDecimal.valueOf(100))
                                    .divide(budget.getPlannedAmount(), 0, RoundingMode.HALF_UP)
                                    .intValue();
                    return new BudgetAlert(
                            budget.getCategoryId(),
                            budget.getPlannedAmount(),
                            spent,
                            percentageUsed,
                            percentageUsed >= budget.getAlertThresholdPct(),
                            spent.compareTo(budget.getPlannedAmount()) > 0);
                })
                .toList();
    }
}
