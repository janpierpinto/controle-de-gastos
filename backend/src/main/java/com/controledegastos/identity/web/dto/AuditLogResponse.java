package com.controledegastos.identity.web.dto;

import com.controledegastos.shared.audit.AuditLog;
import java.time.Instant;
import java.util.UUID;

public record AuditLogResponse(UUID id, String action, String entity, UUID entityId, UUID actorUserId, Instant occurredAt) {

    public static AuditLogResponse from(AuditLog log) {
        return new AuditLogResponse(log.getId(), log.getAction(), log.getEntity(), log.getEntityId(), log.getActorUserId(), log.getOccurredAt());
    }
}
