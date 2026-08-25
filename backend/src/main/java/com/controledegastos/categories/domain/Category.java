package com.controledegastos.categories.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

/**
 * tenantId null means a global default category (seeded via Flyway, see
 * V4__seed_default_categories.sql), visible to every tenant but only
 * creatable by the migration role — the categories_insert RLS policy
 * rejects any application-level insert that isn't scoped to the caller's
 * own tenant.
 */
@Entity
@Table(name = "categories")
public class Category {

    @Id
    private UUID id = UUID.randomUUID();

    @Column(name = "tenant_id")
    private UUID tenantId;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 50)
    private String icon;

    @Column(length = 20)
    private String color;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CategoryType type;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected Category() {
    }

    public Category(UUID tenantId, String name, String icon, String color, CategoryType type) {
        this.tenantId = tenantId;
        this.name = name;
        this.icon = icon;
        this.color = color;
        this.type = type;
    }

    public UUID getId() {
        return id;
    }

    public UUID getTenantId() {
        return tenantId;
    }

    public String getName() {
        return name;
    }

    public String getIcon() {
        return icon;
    }

    public String getColor() {
        return color;
    }

    public CategoryType getType() {
        return type;
    }

    public boolean isGlobal() {
        return tenantId == null;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
