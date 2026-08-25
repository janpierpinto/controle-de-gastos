package com.controledegastos.shared.tenancy;

import java.util.UUID;

/**
 * Holds the authenticated user of the request currently being processed on
 * this thread. Exists mainly to resolve the login bootstrap problem: before
 * a tenant is chosen, RLS still needs a way to let a user find the tenants
 * they belong to (see the tenant_members policy in V1__init_multitenant_schema.sql).
 */
public final class UserContext {

    private static final ThreadLocal<UUID> CURRENT_USER = new ThreadLocal<>();

    private UserContext() {
    }

    public static void set(UUID userId) {
        CURRENT_USER.set(userId);
    }

    public static UUID get() {
        return CURRENT_USER.get();
    }

    public static void clear() {
        CURRENT_USER.remove();
    }
}
