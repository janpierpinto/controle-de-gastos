package com.controledegastos.insights.application;

import com.controledegastos.bills.BillsQueryApi;
import com.controledegastos.budgets.BudgetsQueryApi;
import com.controledegastos.categories.CategoriesQueryApi;
import com.controledegastos.transactions.TransactionSummary;
import com.controledegastos.transactions.TransactionsQueryApi;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

/**
 * Fase 2's rule-based insight engine: no ML/LLM involved, just straight
 * comparisons over data other modules already expose. Kept as a single
 * service (rather than a pluggable InsightProvider strategy) since there's
 * currently only one provider — Fase 3's AI-based provider can introduce
 * that abstraction when it actually has a second implementation to plug in.
 */
@Service
public class InsightsService {

    private static final BigDecimal COMPARISON_THRESHOLD_PCT = BigDecimal.valueOf(20);
    private static final BigDecimal RECURRING_TOLERANCE_PCT = BigDecimal.valueOf(10);
    private static final NumberFormat CURRENCY_FORMAT = NumberFormat.getCurrencyInstance(Locale.of("pt", "BR"));

    private final BudgetsQueryApi budgetsQueryApi;
    private final BillsQueryApi billsQueryApi;
    private final TransactionsQueryApi transactionsQueryApi;
    private final CategoriesQueryApi categoriesQueryApi;

    public InsightsService(
            BudgetsQueryApi budgetsQueryApi,
            BillsQueryApi billsQueryApi,
            TransactionsQueryApi transactionsQueryApi,
            CategoriesQueryApi categoriesQueryApi) {
        this.budgetsQueryApi = budgetsQueryApi;
        this.billsQueryApi = billsQueryApi;
        this.transactionsQueryApi = transactionsQueryApi;
        this.categoriesQueryApi = categoriesQueryApi;
    }

    public List<Insight> generate() {
        var insights = new ArrayList<Insight>();
        insights.addAll(budgetInsights());
        insights.addAll(billInsights());
        insights.addAll(monthComparisonInsights());
        insights.addAll(recurringInsights());
        insights.sort(Comparator.comparing(Insight::severity));
        return insights;
    }

    private List<Insight> budgetInsights() {
        var alerts = budgetsQueryApi.currentMonthAlerts().stream()
                .filter(alert -> alert.alertTriggered() || alert.exceeded())
                .toList();
        var names = categoriesQueryApi.namesByIds(alerts.stream().map(a -> a.categoryId()).toList());

        return alerts.stream()
                .map(alert -> {
                    var name = names.getOrDefault(alert.categoryId(), "categoria");
                    if (alert.exceeded()) {
                        return new Insight(
                                InsightType.BUDGET_ALERT,
                                Severity.DANGER,
                                "Orçamento de " + name + " estourado",
                                "Você já gastou " + money(alert.spentAmount()) + " de " + money(alert.plannedAmount())
                                        + " (" + alert.percentageUsed() + "%) em " + name + " este mês.");
                    }
                    return new Insight(
                            InsightType.BUDGET_ALERT,
                            Severity.WARNING,
                            "Orçamento de " + name + " quase no limite",
                            "Você já usou " + alert.percentageUsed() + "% do orçamento de " + name + " ("
                                    + money(alert.spentAmount()) + " de " + money(alert.plannedAmount()) + ").");
                })
                .toList();
    }

    private List<Insight> billInsights() {
        return billsQueryApi.upcomingWithinDays(7).stream()
                .map(bill -> {
                    if (bill.overdue()) {
                        return new Insight(
                                InsightType.UPCOMING_BILL,
                                Severity.DANGER,
                                bill.description() + " está atrasada",
                                "Vencimento era " + bill.dueDate() + ", valor de " + money(bill.amount()) + ".");
                    }
                    var daysLabel = bill.daysUntilDue() == 0
                            ? "hoje"
                            : "em " + bill.daysUntilDue() + " dia" + (bill.daysUntilDue() > 1 ? "s" : "");
                    return new Insight(
                            InsightType.UPCOMING_BILL,
                            Severity.INFO,
                            bill.description() + " vence " + daysLabel,
                            "Valor de " + money(bill.amount()) + ", vencimento em " + bill.dueDate() + ".");
                })
                .toList();
    }

    private List<Insight> monthComparisonInsights() {
        var currentMonthStart = YearMonth.now().atDay(1);
        var previousMonthStart = currentMonthStart.minusMonths(1);
        var previousMonthEnd = currentMonthStart.minusDays(1);
        var today = LocalDate.now();

        var currentTotals = totalsByCategory(transactionsQueryApi.listInPeriod(currentMonthStart, today));
        var previousTotals = totalsByCategory(transactionsQueryApi.listInPeriod(previousMonthStart, previousMonthEnd));

        var categoryIds = new HashSet<UUID>();
        categoryIds.addAll(currentTotals.keySet());
        categoryIds.addAll(previousTotals.keySet());
        var names = categoriesQueryApi.namesByIds(categoryIds);

        var insights = new ArrayList<Insight>();
        for (var categoryId : categoryIds) {
            var previous = previousTotals.getOrDefault(categoryId, BigDecimal.ZERO);
            var current = currentTotals.getOrDefault(categoryId, BigDecimal.ZERO);
            if (previous.signum() <= 0) {
                continue;
            }
            var changePct = current.subtract(previous)
                    .multiply(BigDecimal.valueOf(100))
                    .divide(previous, 0, RoundingMode.HALF_UP);
            var name = names.getOrDefault(categoryId, "categoria");

            if (changePct.compareTo(COMPARISON_THRESHOLD_PCT) >= 0) {
                insights.add(new Insight(
                        InsightType.MONTH_COMPARISON,
                        Severity.WARNING,
                        "Gastos com " + name + " aumentaram",
                        "Você gastou " + money(current) + " este mês, " + changePct + "% a mais que no mês passado ("
                                + money(previous) + ")."));
            } else if (changePct.compareTo(COMPARISON_THRESHOLD_PCT.negate()) <= 0) {
                insights.add(new Insight(
                        InsightType.MONTH_COMPARISON,
                        Severity.SUCCESS,
                        "Você economizou em " + name,
                        "Gastos com " + name + " caíram " + changePct.abs() + "% em relação ao mês passado ("
                                + money(previous) + " → " + money(current) + ")."));
            }
        }
        return insights;
    }

    private List<Insight> recurringInsights() {
        var from = YearMonth.now().minusMonths(2).atDay(1);
        var to = LocalDate.now();
        var transactions = transactionsQueryApi.listInPeriod(from, to).stream()
                .filter(t -> "EXPENSE".equals(t.type()))
                .toList();

        var byDescription = new HashMap<String, List<Occurrence>>();
        for (var transaction : transactions) {
            var key = normalize(transaction.description());
            byDescription
                    .computeIfAbsent(key, k -> new ArrayList<>())
                    .add(new Occurrence(YearMonth.from(transaction.occurredOn()), transaction.amount(), transaction.description()));
        }

        var insights = new ArrayList<Insight>();
        for (var occurrences : byDescription.values()) {
            var distinctMonths = occurrences.stream().map(Occurrence::month).collect(Collectors.toSet());
            if (distinctMonths.size() < 2) {
                continue;
            }

            var average = occurrences.stream()
                    .map(Occurrence::amount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                    .divide(BigDecimal.valueOf(occurrences.size()), 2, RoundingMode.HALF_UP);
            var withinTolerance = occurrences.stream().allMatch(occurrence -> {
                var base = average.signum() == 0 ? BigDecimal.ONE : average;
                var diffPct = occurrence.amount().subtract(average).abs()
                        .multiply(BigDecimal.valueOf(100))
                        .divide(base, 0, RoundingMode.HALF_UP);
                return diffPct.compareTo(RECURRING_TOLERANCE_PCT) <= 0;
            });
            if (!withinTolerance) {
                continue;
            }

            insights.add(new Insight(
                    InsightType.RECURRING_DETECTED,
                    Severity.INFO,
                    "Gasto recorrente detectado: " + occurrences.get(0).rawDescription(),
                    "Identificamos esse gasto (~" + money(average) + ") em " + distinctMonths.size()
                            + " meses diferentes. Considere cadastrar como conta fixa para receber lembretes."));
        }
        return insights.stream().limit(5).toList();
    }

    private Map<UUID, BigDecimal> totalsByCategory(List<TransactionSummary> transactions) {
        var totals = new HashMap<UUID, BigDecimal>();
        for (var transaction : transactions) {
            if (!"EXPENSE".equals(transaction.type()) || transaction.categoryId() == null) {
                continue;
            }
            totals.merge(transaction.categoryId(), transaction.amount(), BigDecimal::add);
        }
        return totals;
    }

    private String normalize(String description) {
        return description.trim().toLowerCase(Locale.of("pt", "BR"));
    }

    private String money(BigDecimal value) {
        return CURRENCY_FORMAT.format(value);
    }

    private record Occurrence(YearMonth month, BigDecimal amount, String rawDescription) {
    }
}
