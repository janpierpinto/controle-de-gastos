package com.controledegastos.budgets;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
@AutoConfigureMockMvc
class BudgetsFlowIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void budgetTracksSpendingAndTriggersAlertWhenThresholdExceeded() throws Exception {
        var token = registerAndGetAccessToken();
        var categoryId = findCategoryId(token, "Alimentação");

        createTransaction(token, categoryId, "180.00", "2026-08-05");
        createTransaction(token, categoryId, "30.00", "2026-08-10");

        var createBody = """
                {"categoryId":"%s","monthReference":"2026-08-01","plannedAmount":200.00,"alertThresholdPct":80}
                """.formatted(categoryId);

        mockMvc.perform(post("/api/v1/budgets")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.spentAmount").value(210.00))
                .andExpect(jsonPath("$.percentageUsed").value(105))
                .andExpect(jsonPath("$.alertTriggered").value(true))
                .andExpect(jsonPath("$.exceeded").value(true));

        mockMvc.perform(get("/api/v1/budgets?month=2026-08-01").header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].spentAmount").value(210.00));
    }

    private void createTransaction(String token, String categoryId, String amount, String occurredOn) throws Exception {
        var body = """
                {"categoryId":"%s","description":"Compra","amount":%s,"occurredOn":"%s","type":"EXPENSE","recurring":false,"notes":null}
                """.formatted(categoryId, amount, occurredOn);

        mockMvc.perform(post("/api/v1/transactions")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated());
    }

    private String findCategoryId(String token, String name) throws Exception {
        var result = mockMvc.perform(get("/api/v1/categories").header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andReturn();

        var categories = (JsonNode) objectMapper.readTree(result.getResponse().getContentAsString());
        for (var category : categories) {
            if (category.get("name").asText().equals(name)) {
                return category.get("id").asText();
            }
        }
        throw new IllegalStateException("Categoria não encontrada: " + name);
    }

    private String registerAndGetAccessToken() throws Exception {
        var email = "budgets+" + System.nanoTime() + "@example.com";
        var body = """
                {"tenantName":"Familia Orcamento","email":"%s","password":"senha12345","name":"Responsável","acceptedTerms":true}
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
