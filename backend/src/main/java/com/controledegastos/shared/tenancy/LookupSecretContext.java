package com.controledegastos.shared.tenancy;

/**
 * Holds an opaque secret (e.g. an invitation token) that a specific RLS
 * policy accepts as an alternative to tenant/user scoping, for flows where
 * the caller isn't part of any tenant yet but holds a hard-to-guess value
 * that proves they're allowed to read one specific row. See the
 * invitations_select/update policies in V8__invitations.sql.
 */
public final class LookupSecretContext {

    private static final ThreadLocal<String> CURRENT_SECRET = new ThreadLocal<>();

    private LookupSecretContext() {
    }

    public static void set(String secret) {
        CURRENT_SECRET.set(secret);
    }

    public static String get() {
        return CURRENT_SECRET.get();
    }

    public static void clear() {
        CURRENT_SECRET.remove();
    }
}
