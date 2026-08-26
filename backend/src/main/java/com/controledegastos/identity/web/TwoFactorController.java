package com.controledegastos.identity.web;

import com.controledegastos.identity.application.TwoFactorService;
import com.controledegastos.identity.web.dto.TwoFactorDisableRequest;
import com.controledegastos.identity.web.dto.TwoFactorEnableRequest;
import com.controledegastos.identity.web.dto.TwoFactorSetupResponse;
import com.controledegastos.identity.web.dto.TwoFactorStatusResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Authenticated "account security" settings — not covered by
 * SecurityConfig's permitAll list, unlike /api/v1/auth/2fa/verify (the
 * login-time step, which runs before the user has a session).
 */
@RestController
@RequestMapping("/api/v1/auth/2fa")
public class TwoFactorController {

    private final TwoFactorService twoFactorService;

    public TwoFactorController(TwoFactorService twoFactorService) {
        this.twoFactorService = twoFactorService;
    }

    @GetMapping("/status")
    public TwoFactorStatusResponse status() {
        return new TwoFactorStatusResponse(twoFactorService.isEnabled());
    }

    @PostMapping("/setup")
    public TwoFactorSetupResponse setup() {
        return TwoFactorSetupResponse.from(twoFactorService.setup());
    }

    @PostMapping("/enable")
    public ResponseEntity<Void> enable(@Valid @RequestBody TwoFactorEnableRequest request) {
        twoFactorService.enable(request.code());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/disable")
    public ResponseEntity<Void> disable(@Valid @RequestBody TwoFactorDisableRequest request) {
        twoFactorService.disable(request.password());
        return ResponseEntity.noContent().build();
    }
}
