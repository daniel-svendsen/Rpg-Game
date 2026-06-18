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
    private final AuthEventLogger authEventLogger;
    private final Clock clock;
    private final Map<String, AttemptWindow> registerIpAttempts = new ConcurrentHashMap<>();
    private final Map<String, AttemptWindow> registerEmailAttempts = new ConcurrentHashMap<>();
    private final Map<String, AttemptWindow> loginIpFailures = new ConcurrentHashMap<>();
    private final Map<String, AttemptWindow> loginEmailFailures = new ConcurrentHashMap<>();

    @Autowired
    public AuthRateLimiter(AuthRateLimitProperties properties, AuthEventLogger authEventLogger) {
        this(properties, authEventLogger, Clock.systemUTC());
    }

    AuthRateLimiter(AuthRateLimitProperties properties, AuthEventLogger authEventLogger, Clock clock) {
        this.properties = properties;
        this.authEventLogger = authEventLogger;
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
            authEventLogger.registerRateLimited(request, email);
            throw new AuthException(
                    HttpStatus.TOO_MANY_REQUESTS,
                    "AUTH_RATE_LIMITED",
                    "Too many account creation attempts. Please wait a moment and try again."
            );
        }
    }

    public void checkLoginAllowed(HttpServletRequest request, String email) {
        AuthRateLimitProperties.Login loginProperties = properties.getLogin();
        if (!loginProperties.isEnabled()) {
            return;
        }

        Instant now = clock.instant();
        Duration window = loginProperties.getWindow();
        if (isInvalidWindow(window)) {
            return;
        }

        pruneExpired(loginIpFailures, now, window);
        pruneExpired(loginEmailFailures, now, window);

        boolean ipAllowed = isWithinLimit(
                loginIpFailures,
                loginIpKey(request),
                loginProperties.getMaxAttemptsPerIp(),
                now,
                window
        );
        boolean emailAllowed = isWithinLimit(
                loginEmailFailures,
                loginEmailKey(email),
                loginProperties.getMaxAttemptsPerEmail(),
                now,
                window
        );

        if (!ipAllowed || !emailAllowed) {
            authEventLogger.loginRateLimited(request, email);
            throw new AuthException(
                    HttpStatus.TOO_MANY_REQUESTS,
                    "AUTH_RATE_LIMITED",
                    "Too many failed login attempts. Please wait a moment and try again."
            );
        }
    }

    public void recordFailedLogin(HttpServletRequest request, String email) {
        AuthRateLimitProperties.Login loginProperties = properties.getLogin();
        if (!loginProperties.isEnabled()) {
            return;
        }

        Instant now = clock.instant();
        Duration window = loginProperties.getWindow();
        if (isInvalidWindow(window)) {
            return;
        }

        pruneExpired(loginIpFailures, now, window);
        pruneExpired(loginEmailFailures, now, window);

        recordAttempt(loginIpFailures, loginIpKey(request), loginProperties.getMaxAttemptsPerIp(), now, window);
        recordAttempt(loginEmailFailures, loginEmailKey(email), loginProperties.getMaxAttemptsPerEmail(), now, window);
    }

    public void clearLoginFailures(String email) {
        loginEmailFailures.remove(loginEmailKey(email));
    }

    void clear() {
        registerIpAttempts.clear();
        registerEmailAttempts.clear();
        loginIpFailures.clear();
        loginEmailFailures.clear();
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

    private boolean isWithinLimit(
            Map<String, AttemptWindow> attempts,
            String key,
            int maxAttempts,
            Instant now,
            Duration window
    ) {
        if (maxAttempts <= 0) {
            return false;
        }

        AttemptWindow attemptWindow = attempts.get(key);
        return attemptWindow == null || attemptWindow.isExpired(now, window) || attemptWindow.count() < maxAttempts;
    }

    private void pruneExpired(Map<String, AttemptWindow> attempts, Instant now, Duration window) {
        attempts.entrySet().removeIf(entry -> entry.getValue().isExpired(now, window));
    }

    private boolean isInvalidWindow(Duration window) {
        return window == null || window.isZero() || window.isNegative();
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

    private String loginIpKey(HttpServletRequest request) {
        return "login:ip:" + resolveClientAddress(request);
    }

    private String loginEmailKey(String email) {
        return "login:email:" + normalizeEmail(email);
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
