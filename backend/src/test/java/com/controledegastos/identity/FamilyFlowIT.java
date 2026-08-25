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
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
@AutoConfigureMockMvc
class FamilyFlowIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void ownerInvitesMemberWhoJoinsAndCanBeRemoved() throws Exception {
        var ownerToken = registerAndGetAccessToken();
        var memberEmail = "membro+" + System.nanoTime() + "@example.com";

        var inviteResult = mockMvc.perform(post("/api/v1/family/invitations")
                        .header("Authorization", bearer(ownerToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s","role":"MEMBER"}
                                """.formatted(memberEmail)))
                .andExpect(status().isCreated())
                .andReturn();

        var invitationToken = objectMapper.readTree(inviteResult.getResponse().getContentAsString()).get("token").asText();

        var acceptResult = mockMvc.perform(post("/api/v1/family/invitations/accept")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"token":"%s","name":"Novo Membro","password":"senha12345"}
                                """.formatted(invitationToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("MEMBER"))
                .andReturn();

        var memberToken = objectMapper.readTree(acceptResult.getResponse().getContentAsString()).get("accessToken").asText();

        // O novo membro tenta convidar alguém — deve ser barrado (só OWNER/ADMIN podem).
        mockMvc.perform(post("/api/v1/family/invitations")
                        .header("Authorization", bearer(memberToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"outra+pessoa@example.com","role":"MEMBER"}
                                """))
                .andExpect(status().isForbidden());

        var membersResult = mockMvc.perform(get("/api/v1/family/members").header("Authorization", bearer(ownerToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andReturn();

        var members = objectMapper.readTree(membersResult.getResponse().getContentAsString());
        var newMemberId = findMemberIdByRole(members, "MEMBER");

        mockMvc.perform(delete("/api/v1/family/members/" + newMemberId).header("Authorization", bearer(ownerToken)))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/family/members").header("Authorization", bearer(ownerToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    private String findMemberIdByRole(JsonNode members, String role) {
        for (var member : members) {
            if (member.get("role").asText().equals(role)) {
                return member.get("id").asText();
            }
        }
        throw new IllegalStateException("Membro com papel " + role + " não encontrado");
    }

    private String registerAndGetAccessToken() throws Exception {
        var email = "familia+" + System.nanoTime() + "@example.com";
        var body = """
                {"tenantName":"Familia Convite","email":"%s","password":"senha12345","name":"Responsável","acceptedTerms":true}
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
