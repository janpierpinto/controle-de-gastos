package com.controledegastos.notifications.web.dto;

import jakarta.validation.constraints.NotBlank;

public record SubscribeRequest(
        @NotBlank(message = "obrigatório") String endpoint,
        @NotBlank(message = "obrigatório") String p256dh,
        @NotBlank(message = "obrigatório") String auth) {
}
