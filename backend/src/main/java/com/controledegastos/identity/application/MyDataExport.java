package com.controledegastos.identity.application;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record MyDataExport(UUID id, String name, String email, Instant createdAt, List<Membership> memberships) {

    public record Membership(UUID tenantId, String tenantName, String role, Instant joinedAt) {
    }
}
