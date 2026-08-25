package com.controledegastos.creditcards;

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

@Import(TestcontainersConfiguration.class)
@SpringBootTest
@AutoConfigureMockMvc
class CreditCardsFlowIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void creditCardTracksInvoiceForCalendarMonth() throws Exception {
        var token = registerAndGetAccessToken();
        var categoryId = findCategoryId(token, "Compras");

        var cardResult = mockMvc.perform(post("/api/v1/credit-cards")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Nubank","brand":"Mastercard","creditLimit":3000.00,"closingDay":5,"dueDay":12}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.invoiceAmount").doesNotExist())
                .andReturn();

        var cardId = objectMapper.readTree(cardResult.getResponse().getContentAsString()).get("id").asText();

        createTransaction(token, categoryId, cardId, "99.90", "2026-08-12");
        createTransaction(token, categoryId, cardId, "45.00", "2026-08-20");
        // Fora do mês consultado — não deve entrar na fatura de agosto.
        createTransaction(token, categoryId, cardId, "500.00", "2026-07-15");

        mockMvc.perform(get("/api/v1/credit-cards?month=2026-08-01").header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].name").value("Nubank"))
                .andExpect(jsonPath("$[0].invoiceAmount").value(144.90));
    }

    private void createTransaction(String token, String categoryId, String cardId, String amount, String occurredOn) throws Exception {
        var body = """
                {"categoryId":"%s","creditCardId":"%s","description":"Compra","amount":%s,"occurredOn":"%s","type":"EXPENSE","recurring":false,"notes":null}
                """.formatted(categoryId, cardId, amount, occurredOn);

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

        var categories = objectMapper.readTree(result.getResponse().getContentAsString());
        for (var category : categories) {
            if (category.get("name").asText().equals(name)) {
                return category.get("id").asText();
            }
        }
        throw new IllegalStateException("Categoria não encontrada: " + name);
    }

    private String registerAndGetAccessToken() throws Exception {
        var email = "creditcards+" + System.nanoTime() + "@example.com";
        var body = """
                {"tenantName":"Familia Cartao","email":"%s","password":"senha12345","name":"Responsável"}
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
