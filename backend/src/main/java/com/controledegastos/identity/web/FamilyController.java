package com.controledegastos.identity.web;

import com.controledegastos.identity.application.FamilyService;
import com.controledegastos.identity.web.dto.AcceptInvitationRequest;
import com.controledegastos.identity.web.dto.AuthResponse;
import com.controledegastos.identity.web.dto.InvitationResponse;
import com.controledegastos.identity.web.dto.InviteRequest;
import com.controledegastos.identity.web.dto.MemberResponse;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/family")
public class FamilyController {

    private final FamilyService familyService;

    public FamilyController(FamilyService familyService) {
        this.familyService = familyService;
    }

    @GetMapping("/members")
    public List<MemberResponse> listMembers() {
        return familyService.listMembers().stream().map(MemberResponse::from).toList();
    }

    @GetMapping("/invitations")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public List<InvitationResponse> listInvitations() {
        return familyService.listPendingInvitations().stream().map(InvitationResponse::from).toList();
    }

    @PostMapping("/invitations")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<InvitationResponse> invite(@Valid @RequestBody InviteRequest request) {
        var invitation = familyService.invite(request.email(), request.role());
        return ResponseEntity.status(HttpStatus.CREATED).body(InvitationResponse.from(invitation));
    }

    /** Público — quem recebeu o link do convite ainda não está autenticado em nenhum tenant. */
    @PostMapping("/invitations/accept")
    public AuthResponse acceptInvitation(@Valid @RequestBody AcceptInvitationRequest request) {
        var result = familyService.acceptInvitation(request.token(), request.name(), request.password());
        return AuthResponse.from(result);
    }

    @DeleteMapping("/members/{id}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<Void> removeMember(@PathVariable UUID id) {
        familyService.removeMember(id);
        return ResponseEntity.noContent().build();
    }
}
