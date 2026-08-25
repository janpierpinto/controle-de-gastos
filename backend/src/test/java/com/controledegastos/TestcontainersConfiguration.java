package com.controledegastos;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.test.context.DynamicPropertyRegistrar;
import org.testcontainers.postgresql.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

@TestConfiguration(proxyBeanMethods = false)
public class TestcontainersConfiguration {

	private static final String APP_ROLE = "app_runtime";
	private static final String APP_ROLE_PASSWORD = "app_runtime";

	@Bean
	PostgreSQLContainer postgresContainer() {
		return new PostgreSQLContainer(DockerImageName.parse("postgres:latest"))
				.withInitScript("testcontainers/create-app-role.sql");
	}

	/**
	 * Deliberately not @ServiceConnection: that would point the application
	 * datasource at the container's bootstrap (superuser) role, under which
	 * RLS tests would pass even with broken or missing policies. Flyway
	 * migrates as the bootstrap role (needs CREATE TABLE/POLICY); the
	 * application datasource only ever connects as the restricted
	 * app_runtime role created by create-app-role.sql.
	 */
	@Bean
	DynamicPropertyRegistrar postgresConnectionProperties(PostgreSQLContainer postgresContainer) {
		return registry -> {
			registry.add("spring.flyway.url", postgresContainer::getJdbcUrl);
			registry.add("spring.flyway.user", postgresContainer::getUsername);
			registry.add("spring.flyway.password", postgresContainer::getPassword);

			registry.add("spring.datasource.url", postgresContainer::getJdbcUrl);
			registry.add("spring.datasource.username", () -> APP_ROLE);
			registry.add("spring.datasource.password", () -> APP_ROLE_PASSWORD);
		};
	}
}
