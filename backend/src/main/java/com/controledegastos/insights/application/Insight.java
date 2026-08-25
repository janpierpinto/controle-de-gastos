package com.controledegastos.insights.application;

public record Insight(InsightType type, Severity severity, String title, String description) {
}
