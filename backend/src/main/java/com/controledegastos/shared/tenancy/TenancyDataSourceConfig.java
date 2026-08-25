package com.controledegastos.shared.tenancy;

import javax.sql.DataSource;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Wraps the autoconfigured "dataSource" bean (Hikari, or the Testcontainers
 * service-connection equivalent in tests) with {@link TenantAwareDataSource}.
 *
 * This has to be a BeanPostProcessor rather than a plain @Bean of type
 * DataSource: declaring a second DataSource-typed @Bean makes Spring Boot's
 * DataSourceAutoConfiguration see a DataSource already satisfied via its own
 * @ConditionalOnMissingBean(DataSource.class) and skip creating the real
 * "dataSource" bean entirely, so there is nothing left to wrap. Post-processing
 * the already-created bean by name sidesteps that.
 */
@Configuration
public class TenancyDataSourceConfig {

    private static final String DATASOURCE_BEAN_NAME = "dataSource";

    @Bean
    static BeanPostProcessor tenantAwareDataSourceBeanPostProcessor() {
        return new BeanPostProcessor() {
            @Override
            public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
                if (DATASOURCE_BEAN_NAME.equals(beanName)
                        && bean instanceof DataSource dataSource
                        && !(dataSource instanceof TenantAwareDataSource)) {
                    return new TenantAwareDataSource(dataSource);
                }
                return bean;
            }
        };
    }
}
