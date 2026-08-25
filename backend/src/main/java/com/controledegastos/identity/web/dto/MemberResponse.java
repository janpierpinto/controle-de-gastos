package com.controledegastos.identity.web.dto;

import com.controledegastos.identity.domain.MemberRole;
import com.controledegastos.identity.domain.TenantMember;
import java.util.UUID;

public record MemberResponse(UUID id, String name, String email, MemberRole role) {

    public static MemberResponse from(TenantMember member) {
        return new MemberResponse(member.getId(), member.getUser().getName(), member.getUser().getEmail(), member.getRole());
    }
}
