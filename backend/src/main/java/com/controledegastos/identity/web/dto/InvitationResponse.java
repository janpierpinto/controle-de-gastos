package com.controledegastos.identity.web.dto;

import com.controledegastos.identity.domain.Invitation;
import com.controledegastos.identity.domain.MemberRole;
import java.time.Instant;
import java.util.UUID;

public record InvitationResponse(UUID id, String email, MemberRole role, String token, Instant expiresAt) {

    public static InvitationResponse from(Invitation invitation) {
        return new InvitationResponse(
                invitation.getId(), invitation.getEmail(), invitation.getRole(), invitation.getToken(), invitation.getExpiresAt());
    }
}
