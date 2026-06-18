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
    private final AuthEventLogger authEventLogger;

    public AuthController(
            AuthService authService,
            AuthRateLimiter authRateLimiter,
            AuthEventLogger authEventLogger
    ) {
        this.authService = authService;
        this.authRateLimiter = authRateLimiter;
        this.authEventLogger = authEventLogger;
    }

    @PostMapping("/register")
    public AuthResponse register(@Valid @RequestBody AuthRequest request, HttpServletRequest httpRequest) {
        authRateLimiter.checkRegisterAllowed(httpRequest, request.email());
        try {
            return authService.register(request);
        } catch (AuthException exception) {
            throw exception;
        } catch (RuntimeException exception) {
            authEventLogger.unexpectedAuthError(httpRequest, request.email(), "register");
            throw exception;
        }
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
                authEventLogger.failedLogin(httpRequest, request.email());
            }
            throw exception;
        } catch (RuntimeException exception) {
            authEventLogger.unexpectedAuthError(httpRequest, request.email(), "login");
            throw exception;
        }
    }
}

