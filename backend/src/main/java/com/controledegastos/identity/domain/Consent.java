package com.controledegastos.identity.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "consents")
public class Consent {

    public static final String TYPE_PRIVACY_POLICY_AND_TERMS = "PRIVACY_POLICY_AND_TERMS";
    public static final String CURRENT_POLICY_VERSION = "1.0";

    @Id
    private UUID id = UUID.randomUUID();

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(nullable = false, length = 50)
    private String type;

    @Column(name = "policy_version", nullable = false, length = 20)
    private String policyVersion;

    @Column(name = "granted_at", nullable = false)
    private Instant grantedAt = Instant.now();

    protected Consent() {
    }

    public Consent(UUID tenantId, UUID userId, String type, String policyVersion) {
        this.tenantId = tenantId;
        this.userId = userId;
        this.type = type;
        this.policyVersion = policyVersion;
    }

    public UUID getId() {
        return id;
    }

    public String getType() {
        return type;
    }

    public String getPolicyVersion() {
        return policyVersion;
    }

    public Instant getGrantedAt() {
        return grantedAt;
    }
}
