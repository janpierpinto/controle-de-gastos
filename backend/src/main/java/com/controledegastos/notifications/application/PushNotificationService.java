package com.controledegastos.notifications.application;

import com.controledegastos.notifications.domain.PushSubscription;
import com.controledegastos.notifications.infrastructure.PushSubscriptionRepository;
import com.controledegastos.shared.tenancy.TenantContext;
import com.controledegastos.shared.tenancy.UserContext;
import java.security.Security;
import java.util.HashMap;
import java.util.Map;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import nl.martijndwars.webpush.Subscription;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

/**
 * "Push básico" da Fase 1: infraestrutura completa (chaves VAPID, inscrição,
 * envio real via Web Push) mas sem gatilho automático ainda — o botão
 * "notificação de teste" no frontend prova o pipeline inteiro (service
 * worker → subscription → backend → push service dos navegadores) de ponta
 * a ponta. Gatilhos reais (alerta de orçamento, lembrete de conta) entram
 * quando o motor de insights existir (Fase 2/3), para não duplicar lógica
 * de "quando notificar" em dois lugares.
 */
@Service
public class PushNotificationService {

    private static final Logger log = LoggerFactory.getLogger(PushNotificationService.class);

    private final PushSubscriptionRepository pushSubscriptionRepository;
    private final ObjectMapper objectMapper;
    private final String vapidPublicKey;
    private final PushService pushService;

    public PushNotificationService(
            PushSubscriptionRepository pushSubscriptionRepository,
            ObjectMapper objectMapper,
            @Value("${app.push.vapid-public-key}") String vapidPublicKey,
            @Value("${app.push.vapid-private-key}") String vapidPrivateKey,
            @Value("${app.push.subject}") String subject) throws Exception {
        this.pushSubscriptionRepository = pushSubscriptionRepository;
        this.objectMapper = objectMapper;
        this.vapidPublicKey = vapidPublicKey;
        Security.addProvider(new BouncyCastleProvider());
        this.pushService = new PushService(vapidPublicKey, vapidPrivateKey, subject);
    }

    public String vapidPublicKey() {
        return vapidPublicKey;
    }

    @Transactional
    public void subscribe(String endpoint, String p256dh, String auth) {
        pushSubscriptionRepository.findByEndpoint(endpoint).ifPresentOrElse(
                existing -> { /* já registrada, nada a fazer */ },
                () -> pushSubscriptionRepository.save(
                        new PushSubscription(TenantContext.get(), UserContext.get(), endpoint, p256dh, auth)));
    }

    @Transactional
    public void unsubscribe(String endpoint) {
        pushSubscriptionRepository.deleteByEndpoint(endpoint);
    }

    @Transactional(readOnly = true)
    public int sendTestNotificationToCurrentUser() {
        var subscriptions = pushSubscriptionRepository.findAllByUserId(UserContext.get());
        var payload = buildPayload("Controle de Gastos", "Notificações estão funcionando 🎉", "/");

        var sent = 0;
        for (var subscription : subscriptions) {
            if (sendOne(subscription, payload)) {
                sent++;
            }
        }
        return sent;
    }

    private boolean sendOne(PushSubscription subscription, String payload) {
        try {
            var webPushSubscription = new Subscription(
                    subscription.getEndpoint(),
                    new Subscription.Keys(subscription.getP256dh(), subscription.getAuth()));
            var notification = new Notification(webPushSubscription, payload);
            pushService.send(notification);
            return true;
        } catch (Exception ex) {
            log.warn("Falha ao enviar push para subscription {}: {}", subscription.getId(), ex.getMessage());
            return false;
        }
    }

    private String buildPayload(String title, String body, String url) {
        Map<String, String> payload = new HashMap<>();
        payload.put("title", title);
        payload.put("body", body);
        payload.put("url", url);
        return objectMapper.writeValueAsString(payload);
    }
}
