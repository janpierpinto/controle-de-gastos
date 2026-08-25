package com.controledegastos.identity.infrastructure;

import com.controledegastos.identity.domain.Invitation;
import com.controledegastos.identity.domain.InvitationStatus;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InvitationRepository extends JpaRepository<Invitation, UUID> {

    /**
     * Relies on the invitations_select RLS policy's "token = app.lookup_secret"
     * clause (see V8 migration) to find an invitation before any tenant has
     * been selected — only safe to call after LookupSecretContext is set.
     */
    Optional<Invitation> findByToken(String token);

    List<Invitation> findByStatusOrderByCreatedAtDesc(InvitationStatus status);
}
