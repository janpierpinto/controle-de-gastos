package com.controledegastos.categories;

import java.util.Collection;
import java.util.Map;
import java.util.UUID;

/**
 * The categories module's public surface for other modules — see
 * TransactionsQueryApi for why this lives in the module's root package.
 */
public interface CategoriesQueryApi {

    Map<UUID, String> namesByIds(Collection<UUID> ids);
}
