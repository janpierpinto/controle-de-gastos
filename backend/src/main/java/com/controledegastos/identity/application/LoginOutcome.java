package com.controledegastos.identity.application;

/** Login either issues tokens right away, or — when the account has MFA enabled — hands back a short-lived challenge token instead. */
public sealed interface LoginOutcome {

    record Success(AuthResult tokens) implements LoginOutcome {
    }

    record MfaRequired(String mfaToken) implements LoginOutcome {
    }
}
