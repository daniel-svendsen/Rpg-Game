package com.shardborne.config;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThatNoException;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class SecurityStartupValidatorTest {

    @Test
    void productionModeRejectsDefaultJwtSecret() {
        assertThatThrownBy(() -> validator(
                true,
                "change-this-secret-before-production",
                List.of("https://shardborne.pages.dev")
        ).validateProductionSecuritySettings())
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("APP_JWT_SECRET");
    }

    @Test
    void productionModeRejectsWildcardCorsOrigin() {
        assertThatThrownBy(() -> validator(
                true,
                "replace-with-a-real-secret-that-is-long-enough",
                List.of("https://*.pages.dev")
        ).validateProductionSecuritySettings())
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Production CORS origins");
    }

    @Test
    void productionModeAcceptsStrongSecretAndExactHttpsOrigin() {
        assertThatNoException().isThrownBy(() -> validator(
                true,
                "replace-with-a-real-secret-that-is-long-enough",
                List.of("https://shardborne.pages.dev")
        ).validateProductionSecuritySettings());
    }

    @Test
    void localModeAllowsDevelopmentDefaults() {
        assertThatNoException().isThrownBy(() -> validator(
                false,
                "change-this-secret-before-production",
                List.of("http://localhost:*", "capacitor://localhost")
        ).validateProductionSecuritySettings());
    }

    private SecurityStartupValidator validator(boolean productionMode, String jwtSecret, List<String> origins) {
        SecurityHardeningProperties securityProperties = new SecurityHardeningProperties();
        securityProperties.setProductionMode(productionMode);

        ClientProperties clientProperties = new ClientProperties();
        clientProperties.setAllowedOriginPatterns(origins);

        return new SecurityStartupValidator(
                securityProperties,
                new JwtProperties(jwtSecret, 86400),
                clientProperties
        );
    }
}
