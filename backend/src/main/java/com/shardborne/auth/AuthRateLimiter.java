package com.shardborne.auth;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AuthRateLimiter {

    private static final String UNKNOWN_CLIENT = "unknown";

    private final AuthRateLimitProperties properties;
    private final Clock clock;
    private final Map<String, AttemptWindow> registerIpAttempts = new ConcurrentHashMap<>();
    private final Map<String, AttemptWindow> registerEmailAttempts = new ConcurrentHashMap<>();

    @Autowired
    public AuthRateLimiter(AuthRateLimitProperties properties) {
        this(properties, Clock.systemUTC());
    }

    AuthRateLimiter(AuthRateLimitProperties properties, Clock clock) {
        this.properties = properties;
        this.clock = clock;
    }

    public void checkRegisterAllowed(HttpServletRequest request, String email) {
        AuthRateLimitProperties.Register registerProperties = properties.getRegister();
        if (!registerProperties.isEnabled()) {
            return;
        }

        Instant now = clock.instant();
        Duration window = registerProperties.getWindow();
        if (window == null || window.isZero() || window.isNegative()) {
            return;
        }

        pruneExpired(registerIpAttempts, now, window);
        pruneExpired(registerEmailAttempts, now, window);

        String clientKey = "register:ip:" + resolveClientAddress(request);
        String emailKey = "register:email:" + normalizeEmail(email);

        boolean ipAllowed = recordAttempt(registerIpAttempts, clientKey, registerProperties.getMaxAttemptsPerIp(), now, window);
        boolean emailAllowed = recordAttempt(registerEmailAttempts, emailKey, registerProperties.getMaxAttemptsPerEmail(), now, window);

        if (!ipAllowed || !emailAllowed) {
            throw new AuthException(
                    HttpStatus.TOO_MANY_REQUESTS,
                    "AUTH_RATE_LIMITED",
                    "Too many account creation attempts. Please wait a moment and try again."
            );
        }
    }

    void clear() {
        registerIpAttempts.clear();
        registerEmailAttempts.clear();
    }

    private boolean recordAttempt(
            Map<String, AttemptWindow> attempts,
            String key,
            int maxAttempts,
            Instant now,
            Duration window
    ) {
        if (maxAttempts <= 0) {
            return false;
        }

        AttemptWindow attemptWindow = attempts.compute(key, (ignored, current) -> {
            if (current == null || current.isExpired(now, window)) {
                return new AttemptWindow(now, 1);
            }
            return current.increment();
        });

        return attemptWindow.count() <= maxAttempts;
    }

    private void pruneExpired(Map<String, AttemptWindow> attempts, Instant now, Duration window) {
        attempts.entrySet().removeIf(entry -> entry.getValue().isExpired(now, window));
    }

    private String resolveClientAddress(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",", 2)[0].trim();
        }

        String remoteAddress = request.getRemoteAddr();
        return remoteAddress == null || remoteAddress.isBlank() ? UNKNOWN_CLIENT : remoteAddress;
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }

    private record AttemptWindow(Instant startedAt, int count) {
        private AttemptWindow increment() {
            return new AttemptWindow(startedAt, count + 1);
        }

        private boolean isExpired(Instant now, Duration window) {
            return !startedAt.plus(window).isAfter(now);
        }
    }
}
