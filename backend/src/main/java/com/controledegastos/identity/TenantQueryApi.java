package com.controledegastos.identity;

/**
 * The identity module's public surface for other modules — see
 * transactions.TransactionsQueryApi for why this lives in the module's
 * root package.
 */
public interface TenantQueryApi {

    String currentTenantCurrency();
}
