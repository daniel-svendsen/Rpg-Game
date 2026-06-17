package com.shardborne.config;

import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Locale;

@Component
public class SecurityStartupValidator {

    private static final String LOCAL_JWT_FALLBACK = "change-this-secret-before-production";
    private static final String DEMO_JWT_FALLBACK = "replace-this-demo-secret-before-sharing";
    private static final int MINIMUM_SECRET_LENGTH = 32;

    private final SecurityHardeningProperties securityProperties;
    private final JwtProperties jwtProperties;
    private final ClientProperties clientProperties;

    public SecurityStartupValidator(
            SecurityHardeningProperties securityProperties,
            JwtProperties jwtProperties,
            ClientProperties clientProperties
    ) {
        this.securityProperties = securityProperties;
        this.jwtProperties = jwtProperties;
        this.clientProperties = clientProperties;
    }

    @PostConstruct
    void validateProductionSecuritySettings() {
        if (!securityProperties.isProductionMode()) {
            return;
        }

        validateJwtSecret();
        validateCorsOrigins();
    }

    private void validateJwtSecret() {
        String secret = jwtProperties.secret();
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException("APP_JWT_SECRET is required when APP_SECURITY_PRODUCTION_MODE=true.");
        }

        String trimmedSecret = secret.trim();
        if (trimmedSecret.length() < MINIMUM_SECRET_LENGTH
                || LOCAL_JWT_FALLBACK.equals(trimmedSecret)
                || DEMO_JWT_FALLBACK.equals(trimmedSecret)) {
            throw new IllegalStateException(
                    "APP_JWT_SECRET must be a non-default secret with at least 32 characters when APP_SECURITY_PRODUCTION_MODE=true."
            );
        }
    }

    private void validateCorsOrigins() {
        List<String> allowedOrigins = clientProperties.getAllowedOriginPatterns();
        if (allowedOrigins == null || allowedOrigins.isEmpty()) {
            throw new IllegalStateException(
                    "APP_CLIENT_ALLOWED_ORIGIN_PATTERNS must contain the deployed frontend origin when APP_SECURITY_PRODUCTION_MODE=true."
            );
        }

        for (String origin : allowedOrigins) {
            String normalizedOrigin = origin == null ? "" : origin.trim().toLowerCase(Locale.ROOT);
            if (isUnsafeProductionOrigin(normalizedOrigin)) {
                throw new IllegalStateException(
                        "Production CORS origins must be exact deployed HTTPS frontend origins; unsafe origin: " + origin
                );
            }
        }
    }

    private boolean isUnsafeProductionOrigin(String origin) {
        return origin.isBlank()
                || origin.contains("*")
                || origin.startsWith("http://localhost")
                || origin.startsWith("http://127.")
                || origin.startsWith("http://192.168.")
                || origin.startsWith("http://10.")
                || origin.startsWith("http://172.")
                || origin.startsWith("capacitor://")
                || origin.startsWith("ionic://");
    }
}
