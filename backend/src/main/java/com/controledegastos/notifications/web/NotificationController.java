package com.controledegastos.notifications.web;

import com.controledegastos.notifications.application.PushNotificationService;
import com.controledegastos.notifications.web.dto.SubscribeRequest;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {

    private final PushNotificationService pushNotificationService;

    public NotificationController(PushNotificationService pushNotificationService) {
        this.pushNotificationService = pushNotificationService;
    }

    /** Público — o frontend precisa da chave antes de o usuário estar necessariamente autenticado nesta aba. */
    @GetMapping("/vapid-public-key")
    public Map<String, String> vapidPublicKey() {
        return Map.of("publicKey", pushNotificationService.vapidPublicKey());
    }

    @PostMapping("/subscriptions")
    public ResponseEntity<Void> subscribe(@Valid @RequestBody SubscribeRequest request) {
        pushNotificationService.subscribe(request.endpoint(), request.p256dh(), request.auth());
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @DeleteMapping("/subscriptions")
    public ResponseEntity<Void> unsubscribe(@RequestParam String endpoint) {
        pushNotificationService.unsubscribe(endpoint);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/test")
    public Map<String, Integer> sendTest() {
        return Map.of("sent", pushNotificationService.sendTestNotificationToCurrentUser());
    }
}
