package com.controledegastos.identity;

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

@Import(TestcontainersConfiguration.class)
@SpringBootTest
@AutoConfigureMockMvc
class PrivacyFlowIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void registrationRequiresAcceptingTerms() throws Exception {
        var email = "semaceite+" + System.nanoTime() + "@example.com";
        var body = """
                {"tenantName":"Familia X","email":"%s","password":"senha12345","name":"Teste","acceptedTerms":false}
                """.formatted(email);

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    @Test
    void exportMyDataAndViewAuditLogThenDeleteAccount() throws Exception {
        var email = "privacidade+" + System.nanoTime() + "@example.com";
        var registerBody = """
                {"tenantName":"Familia Privacidade","email":"%s","password":"senha12345","name":"Titular","acceptedTerms":true}
                """.formatted(email);

        var registerResult = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerBody))
                .andExpect(status().isCreated())
                .andReturn();

        var token = objectMapper.readTree(registerResult.getResponse().getContentAsString()).get("accessToken").asText();

        mockMvc.perform(get("/api/v1/privacy/my-data").header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(email))
                .andExpect(jsonPath("$.memberships.length()").value(1))
                .andExpect(jsonPath("$.memberships[0].role").value("OWNER"));

        mockMvc.perform(get("/api/v1/privacy/audit-log").header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.action == 'REGISTER')]").exists());

        mockMvc.perform(delete("/api/v1/privacy/account").header("Authorization", bearer(token)))
                .andExpect(status().isNoContent());

        var loginBody = """
                {"email":"%s","password":"senha12345"}
                """.formatted(email);

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginBody))
                .andExpect(status().isUnauthorized());
    }

    private String bearer(String token) {
        return "Bearer " + token;
    }
}
