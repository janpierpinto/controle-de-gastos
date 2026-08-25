package com.controledegastos.notifications.infrastructure;

import com.controledegastos.notifications.domain.PushSubscription;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PushSubscriptionRepository extends JpaRepository<PushSubscription, UUID> {

    Optional<PushSubscription> findByEndpoint(String endpoint);

    void deleteByEndpoint(String endpoint);

    /** RLS already scopes this to the current tenant. */
    List<PushSubscription> findAllByUserId(UUID userId);
}
