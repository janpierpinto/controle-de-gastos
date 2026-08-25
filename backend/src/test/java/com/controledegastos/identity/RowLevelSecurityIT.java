package com.controledegastos.identity;

import static org.assertj.core.api.Assertions.assertThat;

import com.controledegastos.TestcontainersConfiguration;
import com.controledegastos.identity.domain.MemberRole;
import com.controledegastos.identity.domain.Tenant;
import com.controledegastos.identity.domain.TenantMember;
import com.controledegastos.identity.domain.TenantType;
import com.controledegastos.identity.domain.User;
import com.controledegastos.identity.infrastructure.TenantMemberRepository;
import com.controledegastos.identity.infrastructure.TenantRepository;
import com.controledegastos.identity.infrastructure.UserRepository;
import com.controledegastos.shared.tenancy.TenantContext;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

/**
 * Proves isolation happens at the database layer (Postgres RLS), not just
 * in application query filters: findAll() below issues a plain
 * "SELECT * FROM tenant_members" with no tenant_id predicate at all, yet
 * only the current tenant's row comes back.
 *
 * Deliberately not @Transactional: each repository call must be its own
 * transaction so TenantContext changes reach a fresh connection checkout
 * (see the comment on AuthService.register/login).
 */
@Import(TestcontainersConfiguration.class)
@SpringBootTest
class RowLevelSecurityIT {

    @Autowired
    private TenantRepository tenantRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TenantMemberRepository tenantMemberRepository;

    @Test
    void aTenantCannotSeeAnotherTenantsMembers() {
        var tenantA = tenantRepository.save(new Tenant("Tenant A", TenantType.FAMILY));
        var tenantB = tenantRepository.save(new Tenant("Tenant B", TenantType.FAMILY));
        var userA = userRepository.save(new User("rls-a+" + System.nanoTime() + "@example.com", "hash", "User A"));
        var userB = userRepository.save(new User("rls-b+" + System.nanoTime() + "@example.com", "hash", "User B"));

        saveMemberAsTenant(tenantA, userA);
        saveMemberAsTenant(tenantB, userB);

        TenantContext.set(tenantA.getId());
        try {
            var visibleFromTenantA = tenantMemberRepository.findAll();
            assertThat(visibleFromTenantA).extracting(member -> member.getTenant().getId())
                    .containsOnly(tenantA.getId());
        } finally {
            TenantContext.clear();
        }

        TenantContext.set(tenantB.getId());
        try {
            var visibleFromTenantB = tenantMemberRepository.findAll();
            assertThat(visibleFromTenantB).extracting(member -> member.getTenant().getId())
                    .containsOnly(tenantB.getId());
        } finally {
            TenantContext.clear();
        }
    }

    private void saveMemberAsTenant(Tenant tenant, User user) {
        TenantContext.set(tenant.getId());
        try {
            tenantMemberRepository.save(new TenantMember(tenant, user, MemberRole.OWNER));
        } finally {
            TenantContext.clear();
        }
    }
}
