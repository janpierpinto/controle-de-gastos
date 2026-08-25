package com.controledegastos.identity.web.dto;

import com.controledegastos.identity.domain.MemberRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record InviteRequest(
        @NotBlank(message = "obrigatório") @Email(message = "e-mail inválido") String email,
        @NotNull(message = "obrigatório") MemberRole role) {
}
