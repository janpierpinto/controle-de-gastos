package com.controledegastos.identity;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.controledegastos.TestcontainersConfiguration;
import tools.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
@AutoConfigureMockMvc
class AuthFlowIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void registerThenLoginIssuesTokensForTheSameTenant() throws Exception {
        var email = "familia.silva+" + System.nanoTime() + "@example.com";
        var registerBody = objectMapper.writeValueAsString(new RegisterPayload("Família Silva", email, "senha12345", "Maria Silva", true));

        var registerResult = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.role").value("OWNER"))
                .andReturn();

        var loginBody = objectMapper.writeValueAsString(new LoginPayload(email, "senha12345"));

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.role").value("OWNER"));
    }

    @Test
    void loginWithWrongPasswordIsRejected() throws Exception {
        var email = "familia.souza+" + System.nanoTime() + "@example.com";
        var registerBody = objectMapper.writeValueAsString(new RegisterPayload("Família Souza", email, "senha12345", "João Souza", true));

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerBody))
                .andExpect(status().isCreated());

        var loginBody = objectMapper.writeValueAsString(new LoginPayload(email, "senha-errada"));

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginBody))
                .andExpect(status().isUnauthorized());
    }

    private record RegisterPayload(String tenantName, String email, String password, String name, boolean acceptedTerms) {
    }

    private record LoginPayload(String email, String password) {
    }
}
