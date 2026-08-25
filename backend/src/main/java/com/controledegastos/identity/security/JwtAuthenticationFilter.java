package com.controledegastos.identity.security;

import com.controledegastos.shared.tenancy.LookupSecretContext;
import com.controledegastos.shared.tenancy.TenantContext;
import com.controledegastos.shared.tenancy.UserContext;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    public JwtAuthenticationFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        try {
            authenticateIfBearerTokenPresent(request);
            filterChain.doFilter(request, response);
        } finally {
            TenantContext.clear();
            UserContext.clear();
            LookupSecretContext.clear();
        }
    }

    private void authenticateIfBearerTokenPresent(HttpServletRequest request) {
        var header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (header == null || !header.startsWith("Bearer ")) {
            return;
        }
        try {
            var claims = jwtService.parse(header.substring(7));
            if (!jwtService.isAccessToken(claims)) {
                return;
            }
            var userId = jwtService.userIdOf(claims);
            var tenantId = jwtService.tenantIdOf(claims);
            var role = jwtService.roleOf(claims);

            var principal = new TenantPrincipal(userId, tenantId, role);
            var authorities = List.of(new SimpleGrantedAuthority("ROLE_" + role));
            var authentication = new UsernamePasswordAuthenticationToken(principal, null, authorities);
            SecurityContextHolder.getContext().setAuthentication(authentication);
            TenantContext.set(tenantId);
            UserContext.set(userId);
        } catch (JwtException | IllegalArgumentException ex) {
            SecurityContextHolder.clearContext();
        }
    }
}
