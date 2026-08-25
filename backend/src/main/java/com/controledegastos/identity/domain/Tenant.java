package com.controledegastos.identity.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "tenants")
public class Tenant {

    @Id
    private UUID id = UUID.randomUUID();

    @Column(nullable = false, length = 150)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TenantType type;

    @Column(nullable = false, length = 20)
    private String plan = "FREE";

    @Column(name = "dpo_contact_email")
    private String dpoContactEmail;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected Tenant() {
    }

    public Tenant(String name, TenantType type) {
        this.name = name;
        this.type = type;
    }

    public UUID getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public TenantType getType() {
        return type;
    }

    public String getPlan() {
        return plan;
    }

    public String getDpoContactEmail() {
        return dpoContactEmail;
    }

    public void setDpoContactEmail(String dpoContactEmail) {
        this.dpoContactEmail = dpoContactEmail;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
