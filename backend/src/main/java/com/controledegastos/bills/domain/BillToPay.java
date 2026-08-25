package com.controledegastos.bills.domain;

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

@Entity
@Table(name = "bills_to_pay")
public class BillToPay {

    @Id
    private UUID id = UUID.randomUUID();

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(nullable = false, length = 255)
    private String description;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal amount;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private BillStatus status = BillStatus.PENDING;

    @Column(nullable = false)
    private boolean recurring = false;

    @Column(name = "reminder_days_before", nullable = false)
    private short reminderDaysBefore = 3;

    @Column(name = "paid_at")
    private Instant paidAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected BillToPay() {
    }

    public BillToPay(UUID tenantId, String description, BigDecimal amount, LocalDate dueDate, boolean recurring, short reminderDaysBefore) {
        this.tenantId = tenantId;
        this.description = description;
        this.amount = amount;
        this.dueDate = dueDate;
        this.recurring = recurring;
        this.reminderDaysBefore = reminderDaysBefore;
    }

    public void markPaid() {
        this.status = BillStatus.PAID;
        this.paidAt = Instant.now();
    }

    public boolean isOverdue() {
        return status == BillStatus.PENDING && dueDate.isBefore(LocalDate.now());
    }

    public UUID getId() {
        return id;
    }

    public UUID getTenantId() {
        return tenantId;
    }

    public String getDescription() {
        return description;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public LocalDate getDueDate() {
        return dueDate;
    }

    public BillStatus getStatus() {
        return status;
    }

    public boolean isRecurring() {
        return recurring;
    }

    public short getReminderDaysBefore() {
        return reminderDaysBefore;
    }
}
