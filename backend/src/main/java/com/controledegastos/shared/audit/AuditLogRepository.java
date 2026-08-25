package com.controledegastos.shared.audit;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {

    /** RLS already scopes this to the current tenant. */
    List<AuditLog> findAllByOrderByOccurredAtDesc();
}
