package com.controledegastos.shared.audit;

import com.controledegastos.shared.tenancy.TenantContext;
import com.controledegastos.shared.tenancy.UserContext;
import java.util.UUID;
import org.springframework.stereotype.Service;

/**
 * Callers must make sure TenantContext (and usually UserContext) is already
 * correctly set for the connection this write will use — see the ordering
 * notes on AuthService.register/login. This class doesn't manage that
 * itself; it just records whatever is current.
 */
@Service
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    public void record(String action, String entity, UUID entityId) {
        auditLogRepository.save(new AuditLog(TenantContext.get(), UserContext.get(), action, entity, entityId));
    }
}
