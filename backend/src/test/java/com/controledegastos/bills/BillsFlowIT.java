package com.controledegastos.bills;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
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
class BillsFlowIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void createBillMarkOverdueThenPay() throws Exception {
        var token = registerAndGetAccessToken();

        var overdueResult = mockMvc.perform(post("/api/v1/bills")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"description":"Aluguel","amount":1500.00,"dueDate":"2020-01-05","recurring":true,"reminderDaysBefore":3}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.overdue").value(true))
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andReturn();

        var billId = objectMapper.readTree(overdueResult.getResponse().getContentAsString()).get("id").asText();

        mockMvc.perform(get("/api/v1/bills").header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].overdue").value(true));

        mockMvc.perform(put("/api/v1/bills/" + billId + "/pagar").header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PAID"))
                .andExpect(jsonPath("$.overdue").value(false));
    }

    private String registerAndGetAccessToken() throws Exception {
        var email = "bills+" + System.nanoTime() + "@example.com";
        var body = """
                {"tenantName":"Familia Contas","email":"%s","password":"senha12345","name":"Responsável","acceptedTerms":true}
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
