package com.controledegastos.shared.audit;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

/**
 * Maps to the audit_logs table created in V1__init_multitenant_schema.sql
 * (Fase 0) — it existed unused until this LGPD slice actually started
 * writing to it. metadata_json/ip_address columns aren't mapped yet: no
 * caller needs them for Fase 1's basic security-event trail, and Hibernate
 * validate mode doesn't require mapping every column.
 */
@Entity
@Table(name = "audit_logs")
public class AuditLog {

    @Id
    private UUID id = UUID.randomUUID();

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "actor_user_id")
    private UUID actorUserId;

    @Column(nullable = false, length = 100)
    private String action;

    @Column(nullable = false, length = 100)
    private String entity;

    @Column(name = "entity_id")
    private UUID entityId;

    @Column(name = "occurred_at", nullable = false)
    private Instant occurredAt = Instant.now();

    protected AuditLog() {
    }

    public AuditLog(UUID tenantId, UUID actorUserId, String action, String entity, UUID entityId) {
        this.tenantId = tenantId;
        this.actorUserId = actorUserId;
        this.action = action;
        this.entity = entity;
        this.entityId = entityId;
    }

    public UUID getId() {
        return id;
    }

    public UUID getTenantId() {
        return tenantId;
    }

    public UUID getActorUserId() {
        return actorUserId;
    }

    public String getAction() {
        return action;
    }

    public String getEntity() {
        return entity;
    }

    public UUID getEntityId() {
        return entityId;
    }

    public Instant getOccurredAt() {
        return occurredAt;
    }
}
