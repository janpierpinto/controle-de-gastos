package com.controledegastos.forecast.application;

import com.controledegastos.bills.BillsQueryApi;
import com.controledegastos.transactions.TransactionSummary;
import com.controledegastos.transactions.TransactionsQueryApi;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import org.springframework.stereotype.Service;

/**
 * Plain moving-average forecast — no ML/AI, matching the "no external cost"
 * direction. Projects the trailing HISTORY_MONTHS' average income/expense
 * flat across the requested horizon, then overlays known pending bills per
 * target month as a separate line (bills aren't auto-converted into
 * transactions when paid, so there's no risk of double-counting them into
 * the historical average).
 */
@Service
public class ForecastService {

    private static final int HISTORY_MONTHS = 3;

    private final TransactionsQueryApi transactionsQueryApi;
    private final BillsQueryApi billsQueryApi;

    public ForecastService(TransactionsQueryApi transactionsQueryApi, BillsQueryApi billsQueryApi) {
        this.transactionsQueryApi = transactionsQueryApi;
        this.billsQueryApi = billsQueryApi;
    }

    public List<MonthlyForecast> forecastNextMonths(int monthsAhead) {
        var currentMonth = YearMonth.now();

        var incomeTotals = new ArrayList<BigDecimal>();
        var expenseTotals = new ArrayList<BigDecimal>();
        for (var i = HISTORY_MONTHS; i >= 1; i--) {
            var historicalMonth = currentMonth.minusMonths(i);
            var transactions = transactionsQueryApi.listInPeriod(historicalMonth.atDay(1), historicalMonth.atEndOfMonth());
            incomeTotals.add(sumByType(transactions, "INCOME"));
            expenseTotals.add(sumByType(transactions, "EXPENSE"));
        }
        var avgIncome = average(incomeTotals);
        var avgExpense = average(expenseTotals);

        var horizonEnd = currentMonth.plusMonths(monthsAhead - 1L).atEndOfMonth();
        var daysAhead = Math.max(1, (int) ChronoUnit.DAYS.between(LocalDate.now(), horizonEnd) + 1);
        var billsByMonth = new HashMap<YearMonth, BigDecimal>();
        for (var bill : billsQueryApi.upcomingWithinDays(daysAhead)) {
            billsByMonth.merge(YearMonth.from(bill.dueDate()), bill.amount(), BigDecimal::add);
        }

        var forecasts = new ArrayList<MonthlyForecast>();
        for (var i = 0; i < monthsAhead; i++) {
            var targetMonth = currentMonth.plusMonths(i);
            var knownBills = billsByMonth.getOrDefault(targetMonth, BigDecimal.ZERO);
            var projectedNet = avgIncome.subtract(avgExpense).subtract(knownBills);
            forecasts.add(new MonthlyForecast(targetMonth, avgIncome, avgExpense, knownBills, projectedNet));
        }
        return forecasts;
    }

    private BigDecimal sumByType(List<TransactionSummary> transactions, String type) {
        return transactions.stream()
                .filter(t -> type.equals(t.type()))
                .map(TransactionSummary::amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal average(List<BigDecimal> values) {
        if (values.isEmpty()) {
            return BigDecimal.ZERO;
        }
        var sum = values.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        return sum.divide(BigDecimal.valueOf(values.size()), 2, RoundingMode.HALF_UP);
    }
}
