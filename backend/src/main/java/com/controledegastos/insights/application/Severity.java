package com.controledegastos.insights.application;

/**
 * Declared in priority order (most to least urgent) — InsightsService sorts
 * the combined feed by this enum's ordinal so danger/warning insights
 * surface before informational/positive ones.
 */
public enum Severity {
    DANGER,
    WARNING,
    INFO,
    SUCCESS,
}
