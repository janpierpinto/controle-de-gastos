package com.controledegastos.shared.audit;

import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {

    /** RLS already scopes this to the current tenant. */
    Page<AuditLog> findAllByOrderByOccurredAtDesc(Pageable pageable);
}
