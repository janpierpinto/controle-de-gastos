package com.controledegastos.insights.web;

import com.controledegastos.insights.application.InsightsService;
import com.controledegastos.insights.web.dto.InsightResponse;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/insights")
public class InsightController {

    private final InsightsService insightsService;

    public InsightController(InsightsService insightsService) {
        this.insightsService = insightsService;
    }

    @GetMapping
    public List<InsightResponse> list() {
        return insightsService.generate().stream().map(InsightResponse::from).toList();
    }
}
