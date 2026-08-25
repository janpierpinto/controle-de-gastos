package com.controledegastos.identity.infrastructure;

import com.controledegastos.identity.domain.TenantMember;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface TenantMemberRepository extends JpaRepository<TenantMember, UUID> {

    /**
     * Relies on the tenant_members RLS policy's "user_id = app.current_user"
     * clause (see V1 migration) to find a user's memberships before any
     * tenant has been selected — this is only safe to call after
     * {@link com.controledegastos.shared.tenancy.UserContext} has been set.
     */
    List<TenantMember> findByUserIdOrderByJoinedAtDesc(UUID userId);

    /**
     * No explicit tenant_id filter needed — RLS already scopes this to the
     * current tenant once TenantContext is set (the normal case for an
     * authenticated request). Join-fetches the user so callers can read
     * name/email outside the transaction without a LazyInitializationException.
     */
    @Query("select tm from TenantMember tm join fetch tm.user order by tm.joinedAt asc")
    List<TenantMember> findAllWithUserOrderByJoinedAtAsc();
}
