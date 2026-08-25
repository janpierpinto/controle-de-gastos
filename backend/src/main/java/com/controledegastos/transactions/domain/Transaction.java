package com.controledegastos.transactions.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * categoryId is a plain reference (no JPA relationship into the categories
 * module's entity) on purpose — keeps the transactions and categories
 * Spring Modulith modules loosely coupled, matching how tenant_id itself is
 * already handled as a plain column rather than an entity relationship.
 */
@Entity
@Table(name = "transactions")
public class Transaction {

    @Id
    private UUID id = UUID.randomUUID();

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "category_id")
    private UUID categoryId;

    @Column(name = "credit_card_id")
    private UUID creditCardId;

    @Column(nullable = false, length = 255)
    private String description;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal amount;

    @Column(name = "occurred_on", nullable = false)
    private LocalDate occurredOn;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TransactionType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TransactionOrigin origin = TransactionOrigin.MANUAL;

    @Column(name = "is_recurring", nullable = false)
    private boolean recurring = false;

    @Column(length = 1000)
    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    protected Transaction() {
    }

    public Transaction(
            UUID tenantId,
            UUID categoryId,
            UUID creditCardId,
            String description,
            BigDecimal amount,
            LocalDate occurredOn,
            TransactionType type,
            boolean recurring,
            String notes) {
        this.tenantId = tenantId;
        this.categoryId = categoryId;
        this.creditCardId = creditCardId;
        this.description = description;
        this.amount = amount;
        this.occurredOn = occurredOn;
        this.type = type;
        this.recurring = recurring;
        this.notes = notes;
    }

    public void update(UUID categoryId, UUID creditCardId, String description, BigDecimal amount, LocalDate occurredOn,
            TransactionType type, boolean recurring, String notes) {
        this.categoryId = categoryId;
        this.creditCardId = creditCardId;
        this.description = description;
        this.amount = amount;
        this.occurredOn = occurredOn;
        this.type = type;
        this.recurring = recurring;
        this.notes = notes;
        this.updatedAt = Instant.now();
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

    public UUID getCreditCardId() {
        return creditCardId;
    }

    public String getDescription() {
        return description;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public LocalDate getOccurredOn() {
        return occurredOn;
    }

    public TransactionType getType() {
        return type;
    }

    public TransactionOrigin getOrigin() {
        return origin;
    }

    public boolean isRecurring() {
        return recurring;
    }

    public String getNotes() {
        return notes;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
