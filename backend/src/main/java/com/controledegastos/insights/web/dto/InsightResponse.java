package com.controledegastos.insights.web.dto;

import com.controledegastos.insights.application.Insight;

public record InsightResponse(String type, String severity, String title, String description) {

    public static InsightResponse from(Insight insight) {
        return new InsightResponse(insight.type().name(), insight.severity().name(), insight.title(), insight.description());
    }
}
