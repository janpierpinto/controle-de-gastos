package com.controledegastos.forecast.application;

import java.math.BigDecimal;
import java.time.YearMonth;

public record MonthlyForecast(
        YearMonth month, BigDecimal projectedIncome, BigDecimal projectedExpense, BigDecimal knownBillsTotal, BigDecimal projectedNet) {
}
