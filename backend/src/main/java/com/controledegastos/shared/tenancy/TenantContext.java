package com.controledegastos.shared.tenancy;

import java.util.UUID;

/**
 * Holds the tenant of the request currently being processed on this thread.
 * Set by {@link TenantFilter} and read by {@link TenantAwareDataSource} on
 * every connection checkout, so that Postgres RLS policies can enforce
 * isolation regardless of what query code actually does.
 */
public final class TenantContext {

    private static final ThreadLocal<UUID> CURRENT_TENANT = new ThreadLocal<>();

    private TenantContext() {
    }

    public static void set(UUID tenantId) {
        CURRENT_TENANT.set(tenantId);
    }

    public static UUID get() {
        return CURRENT_TENANT.get();
    }

    public static void clear() {
        CURRENT_TENANT.remove();
    }
}
