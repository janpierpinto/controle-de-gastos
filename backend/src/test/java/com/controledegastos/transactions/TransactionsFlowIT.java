package com.controledegastos.transactions;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.controledegastos.TestcontainersConfiguration;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.ObjectMapper;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
@AutoConfigureMockMvc
class TransactionsFlowIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void createListUpdateDeleteTransaction_andIsolatesAcrossTenants() throws Exception {
        var tokenA = registerAndGetAccessToken("Familia A");
        var tokenB = registerAndGetAccessToken("Familia B");

        mockMvc.perform(get("/api/v1/categories").header("Authorization", bearer(tokenA)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(11));

        var createBody = objectMapper.writeValueAsString(
                new TransactionPayload(null, "Supermercado", new BigDecimal("150.75"), "2026-08-20", "EXPENSE", false, null));

        var createResult = mockMvc.perform(post("/api/v1/transactions")
                        .header("Authorization", bearer(tokenA))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.description").value("Supermercado"))
                .andReturn();

        var transactionId = objectMapper.readTree(createResult.getResponse().getContentAsString()).get("id").asText();

        mockMvc.perform(get("/api/v1/transactions").header("Authorization", bearer(tokenA)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1));

        // Tenant B must not see tenant A's transaction — RLS proven through the real HTTP stack this time.
        mockMvc.perform(get("/api/v1/transactions").header("Authorization", bearer(tokenB)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(0));

        var updateBody = objectMapper.writeValueAsString(
                new TransactionPayload(null, "Supermercado (atualizado)", new BigDecimal("180.00"), "2026-08-21", "EXPENSE", false, "compra do mês"));

        mockMvc.perform(put("/api/v1/transactions/" + transactionId)
                        .header("Authorization", bearer(tokenA))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.description").value("Supermercado (atualizado)"))
                .andExpect(jsonPath("$.amount").value(180.00));

        mockMvc.perform(delete("/api/v1/transactions/" + transactionId).header("Authorization", bearer(tokenA)))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/transactions/" + transactionId).header("Authorization", bearer(tokenA)))
                .andExpect(status().isNotFound());
    }

    private String registerAndGetAccessToken(String tenantName) throws Exception {
        var email = tenantName.toLowerCase().replace(" ", ".") + "+" + System.nanoTime() + "@example.com";
        var body = objectMapper.writeValueAsString(
                new RegisterPayload(tenantName, email, "senha12345", "Responsável"));

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

    private record RegisterPayload(String tenantName, String email, String password, String name) {
    }

    private record TransactionPayload(
            String categoryId, String description, BigDecimal amount, String occurredOn, String type,
            boolean recurring, String notes) {
    }
}
