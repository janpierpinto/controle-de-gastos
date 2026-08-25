package com.controledegastos.identity.web;

import com.controledegastos.identity.application.AuthService;
import com.controledegastos.identity.web.dto.AuthResponse;
import com.controledegastos.identity.web.dto.LoginRequest;
import com.controledegastos.identity.web.dto.RefreshRequest;
import com.controledegastos.identity.web.dto.RegisterRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        var result = authService.register(
                request.tenantName(), request.email(), request.password(), request.name(), request.acceptedTerms());
        return ResponseEntity.status(HttpStatus.CREATED).body(AuthResponse.from(result));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        var result = authService.login(request.email(), request.password());
        return ResponseEntity.ok(AuthResponse.from(result));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@Valid @RequestBody RefreshRequest request) {
        var result = authService.refresh(request.refreshToken());
        return ResponseEntity.ok(AuthResponse.from(result));
    }
}
