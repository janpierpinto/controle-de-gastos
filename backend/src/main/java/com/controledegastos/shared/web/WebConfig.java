package com.controledegastos.shared.web;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.web.config.EnableSpringDataWebSupport;
import org.springframework.data.web.config.EnableSpringDataWebSupport.PageSerializationMode;

/**
 * Serializes Page<T> responses as the stable PagedModel DTO shape
 * (content/page.size/page.number/...) instead of Spring Data's raw
 * PageImpl, which Spring itself warns is not a stable JSON contract.
 */
@Configuration
@EnableSpringDataWebSupport(pageSerializationMode = PageSerializationMode.VIA_DTO)
public class WebConfig {
}
