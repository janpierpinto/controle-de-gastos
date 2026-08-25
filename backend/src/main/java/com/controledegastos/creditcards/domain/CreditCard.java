package com.controledegastos.creditcards.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "credit_cards")
public class CreditCard {

    @Id
    private UUID id = UUID.randomUUID();

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 50)
    private String brand;

    @Column(name = "credit_limit", precision = 14, scale = 2)
    private BigDecimal creditLimit;

    @Column(name = "closing_day", nullable = false)
    private short closingDay;

    @Column(name = "due_day", nullable = false)
    private short dueDay;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected CreditCard() {
    }

    public CreditCard(UUID tenantId, String name, String brand, BigDecimal creditLimit, short closingDay, short dueDay) {
        this.tenantId = tenantId;
        this.name = name;
        this.brand = brand;
        this.creditLimit = creditLimit;
        this.closingDay = closingDay;
        this.dueDay = dueDay;
    }

    public UUID getId() {
        return id;
    }

    public UUID getTenantId() {
        return tenantId;
    }

    public String getName() {
        return name;
    }

    public String getBrand() {
        return brand;
    }

    public BigDecimal getCreditLimit() {
        return creditLimit;
    }

    public short getClosingDay() {
        return closingDay;
    }

    public short getDueDay() {
        return dueDay;
    }
}
