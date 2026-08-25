package com.controledegastos.identity.application;

import com.controledegastos.identity.infrastructure.TenantMemberRepository;
import com.controledegastos.identity.infrastructure.UserRepository;
import com.controledegastos.shared.audit.AuditLog;
import com.controledegastos.shared.audit.AuditLogRepository;
import com.controledegastos.shared.audit.AuditService;
import com.controledegastos.shared.tenancy.UserContext;
import java.util.List;
import java.util.NoSuchElementException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Fluxo LGPD "básico" da Fase 1: exportar os próprios dados e solicitar
 * exclusão da conta. Sem DPIA formal nem fluxo de aprovação com SLA — isso é
 * trabalho de Fase 4 (preparação para SaaS em escala), quando o volume de
 * solicitações justificar um processo dedicado em vez de ação imediata.
 */
@Service
public class PrivacyService {

    private final UserRepository userRepository;
    private final TenantMemberRepository tenantMemberRepository;
    private final AuditLogRepository auditLogRepository;
    private final AuditService auditService;

    public PrivacyService(
            UserRepository userRepository,
            TenantMemberRepository tenantMemberRepository,
            AuditLogRepository auditLogRepository,
            AuditService auditService) {
        this.userRepository = userRepository;
        this.tenantMemberRepository = tenantMemberRepository;
        this.auditLogRepository = auditLogRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<AuditLog> listAuditLog() {
        return auditLogRepository.findAllByOrderByOccurredAtDesc();
    }

    @Transactional(readOnly = true)
    public MyDataExport exportMyData() {
        var user = userRepository.findById(UserContext.get()).orElseThrow(NoSuchElementException::new);
        var memberships = tenantMemberRepository.findByUserIdOrderByJoinedAtDesc(UserContext.get()).stream()
                .map(member -> new MyDataExport.Membership(
                        member.getTenant().getId(), member.getTenant().getName(), member.getRole().name(), member.getJoinedAt()))
                .toList();
        return new MyDataExport(user.getId(), user.getName(), user.getEmail(), user.getCreatedAt(), memberships);
    }

    @Transactional
    public void deleteMyAccount() {
        var user = userRepository.findById(UserContext.get()).orElseThrow(NoSuchElementException::new);
        user.markDeleted();
        auditService.record("ACCOUNT_DELETED", "USER", user.getId());
    }
}
