package com.controledegastos.bills;

import java.util.List;

/**
 * The bills module's public surface for other modules — see
 * TransactionsQueryApi for why this lives in the module's root package.
 */
public interface BillsQueryApi {

    List<UpcomingBill> upcomingWithinDays(int days);
}
