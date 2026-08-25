package com.controledegastos.budgets.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "budgets")
public class Budget {

    @Id
    private UUID id = UUID.randomUUID();

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "category_id", nullable = false)
    private UUID categoryId;

    @Column(name = "month_reference", nullable = false)
    private LocalDate monthReference;

    @Column(name = "planned_amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal plannedAmount;

    @Column(name = "alert_threshold_pct", nullable = false)
    private short alertThresholdPct = 80;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected Budget() {
    }

    public Budget(UUID tenantId, UUID categoryId, LocalDate monthReference, BigDecimal plannedAmount, short alertThresholdPct) {
        this.tenantId = tenantId;
        this.categoryId = categoryId;
        this.monthReference = monthReference.withDayOfMonth(1);
        this.plannedAmount = plannedAmount;
        this.alertThresholdPct = alertThresholdPct;
    }

    public void update(BigDecimal plannedAmount, short alertThresholdPct) {
        this.plannedAmount = plannedAmount;
        this.alertThresholdPct = alertThresholdPct;
    }

    public UUID getId() {
        return id;
    }

    public UUID getTenantId() {
        return tenantId;
    }

    public UUID getCategoryId() {
        return categoryId;
    }

    public LocalDate getMonthReference() {
        return monthReference;
    }

    public BigDecimal getPlannedAmount() {
        return plannedAmount;
    }

    public short getAlertThresholdPct() {
        return alertThresholdPct;
    }
}
