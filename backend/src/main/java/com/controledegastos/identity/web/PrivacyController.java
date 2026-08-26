package com.controledegastos.identity.web;

import com.controledegastos.identity.application.MyDataExport;
import com.controledegastos.identity.application.PrivacyService;
import com.controledegastos.identity.web.dto.AuditLogResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/privacy")
public class PrivacyController {

    private final PrivacyService privacyService;

    public PrivacyController(PrivacyService privacyService) {
        this.privacyService = privacyService;
    }

    @GetMapping("/my-data")
    public MyDataExport myData() {
        return privacyService.exportMyData();
    }

    @DeleteMapping("/account")
    public ResponseEntity<Void> deleteAccount() {
        privacyService.deleteMyAccount();
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/audit-log")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public Page<AuditLogResponse> auditLog(Pageable pageable) {
        return privacyService.listAuditLog(pageable).map(AuditLogResponse::from);
    }
}
