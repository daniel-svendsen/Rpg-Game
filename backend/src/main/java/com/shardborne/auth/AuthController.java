package com.shardborne.auth;

import jakarta.validation.Valid;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final AuthRateLimiter authRateLimiter;

    public AuthController(AuthService authService, AuthRateLimiter authRateLimiter) {
        this.authService = authService;
        this.authRateLimiter = authRateLimiter;
    }

    @PostMapping("/register")
    public AuthResponse register(@Valid @RequestBody AuthRequest request, HttpServletRequest httpRequest) {
        authRateLimiter.checkRegisterAllowed(httpRequest, request.email());
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody AuthRequest request, HttpServletRequest httpRequest) {
        authRateLimiter.checkLoginAllowed(httpRequest, request.email());
        try {
            AuthResponse response = authService.login(request);
            authRateLimiter.clearLoginFailures(request.email());
            return response;
        } catch (AuthException exception) {
            if (exception.getStatus() == HttpStatus.UNAUTHORIZED && "INVALID_CREDENTIALS".equals(exception.getCode())) {
                authRateLimiter.recordFailedLogin(httpRequest, request.email());
            }
            throw exception;
        }
    }
}

