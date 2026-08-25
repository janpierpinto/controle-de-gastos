package com.controledegastos.transactions.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * tenantMemberId is a plain reference into the identity module (no JPA
 * relationship), same convention as categoryId on Transaction — keeps
 * transactions loosely coupled to identity's internal entities.
 */
@Entity
@Table(name = "transaction_splits")
public class TransactionSplit {

    @Id
    private UUID id = UUID.randomUUID();

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "transaction_id", nullable = false)
    private UUID transactionId;

    @Column(name = "tenant_member_id", nullable = false)
    private UUID tenantMemberId;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal amount;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected TransactionSplit() {
    }

    public TransactionSplit(UUID tenantId, UUID transactionId, UUID tenantMemberId, BigDecimal amount) {
        this.tenantId = tenantId;
        this.transactionId = transactionId;
        this.tenantMemberId = tenantMemberId;
        this.amount = amount;
    }

    public UUID getId() {
        return id;
    }

    public UUID getTenantId() {
        return tenantId;
    }

    public UUID getTransactionId() {
        return transactionId;
    }

    public UUID getTenantMemberId() {
        return tenantMemberId;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
