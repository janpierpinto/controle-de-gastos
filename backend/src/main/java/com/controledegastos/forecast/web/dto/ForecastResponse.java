package com.controledegastos.forecast.web.dto;

import com.controledegastos.forecast.application.MonthlyForecast;
import java.math.BigDecimal;

public record ForecastResponse(
        String month, BigDecimal projectedIncome, BigDecimal projectedExpense, BigDecimal knownBillsTotal, BigDecimal projectedNet) {

    public static ForecastResponse from(MonthlyForecast forecast) {
        return new ForecastResponse(
                forecast.month().toString(),
                forecast.projectedIncome(),
                forecast.projectedExpense(),
                forecast.knownBillsTotal(),
                forecast.projectedNet());
    }
}
