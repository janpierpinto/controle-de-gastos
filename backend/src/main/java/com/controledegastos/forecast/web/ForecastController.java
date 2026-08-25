package com.controledegastos.forecast.web;

import com.controledegastos.forecast.application.ForecastService;
import com.controledegastos.forecast.web.dto.ForecastResponse;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/forecast")
public class ForecastController {

    private final ForecastService forecastService;

    public ForecastController(ForecastService forecastService) {
        this.forecastService = forecastService;
    }

    @GetMapping
    public List<ForecastResponse> forecast(@RequestParam(defaultValue = "3") int months) {
        var clamped = Math.min(Math.max(months, 1), 12);
        return forecastService.forecastNextMonths(clamped).stream().map(ForecastResponse::from).toList();
    }
}
