package com.controledegastos.notifications;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.controledegastos.TestcontainersConfiguration;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.ObjectMapper;

/**
 * Cobre o contrato da API (chave VAPID pública, registrar/remover
 * subscription). O envio real de push a um endpoint de verdade só pode ser
 * verificado manualmente com um navegador de verdade — ver docker compose
 * e2e no histórico do commit desta fatia.
 */
@Import(TestcontainersConfiguration.class)
@SpringBootTest
@AutoConfigureMockMvc
class NotificationsFlowIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void vapidPublicKeyIsPubliclyAvailable() throws Exception {
        mockMvc.perform(get("/api/v1/notifications/vapid-public-key"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.publicKey").isNotEmpty());
    }

    @Test
    void subscribeThenUnsubscribe() throws Exception {
        var token = registerAndGetAccessToken();
        var endpoint = "https://fcm.googleapis.com/fcm/send/test-" + System.nanoTime();

        mockMvc.perform(post("/api/v1/notifications/subscriptions")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"endpoint":"%s","p256dh":"fake-p256dh","auth":"fake-auth"}
                                """.formatted(endpoint)))
                .andExpect(status().isCreated());

        mockMvc.perform(delete("/api/v1/notifications/subscriptions")
                        .header("Authorization", bearer(token))
                        .param("endpoint", endpoint))
                .andExpect(status().isNoContent());
    }

    private String registerAndGetAccessToken() throws Exception {
        var email = "push+" + System.nanoTime() + "@example.com";
        var body = """
                {"tenantName":"Familia Push","email":"%s","password":"senha12345","name":"Responsável","acceptedTerms":true}
                """.formatted(email);

        var result = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andReturn();

        return objectMapper.readTree(result.getResponse().getContentAsString()).get("accessToken").asText();
    }

    private String bearer(String token) {
        return "Bearer " + token;
    }
}
