package com.controledegastos.shared.tenancy;

import java.sql.Connection;
import java.sql.SQLException;
import javax.sql.DataSource;
import org.springframework.jdbc.datasource.DelegatingDataSource;

/**
 * Wraps the pooled {@link DataSource} so that every connection checkout
 * stamps the current tenant (or clears it) as a Postgres session variable
 * before the connection is handed to application code. The Postgres RLS
 * policies (see V1__init_multitenant_schema.sql) read this variable to
 * decide which rows are visible, so isolation is enforced by the database
 * itself and not only by application-level query filters.
 */
public class TenantAwareDataSource extends DelegatingDataSource {

    private static final String SET_CONTEXT_SQL =
            "SELECT set_config('app.current_tenant', ?, false), set_config('app.current_user', ?, false)";

    public TenantAwareDataSource(DataSource targetDataSource) {
        super(targetDataSource);
    }

    @Override
    public Connection getConnection() throws SQLException {
        return applyTenant(super.getConnection());
    }

    @Override
    public Connection getConnection(String username, String password) throws SQLException {
        return applyTenant(super.getConnection(username, password));
    }

    private Connection applyTenant(Connection connection) throws SQLException {
        var tenantId = TenantContext.get();
        var userId = UserContext.get();
        try (var statement = connection.prepareStatement(SET_CONTEXT_SQL)) {
            statement.setString(1, tenantId == null ? "" : tenantId.toString());
            statement.setString(2, userId == null ? "" : userId.toString());
            statement.execute();
        }
        return connection;
    }
}
