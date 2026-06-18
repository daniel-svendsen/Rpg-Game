package com.shardborne.auth;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class AuthEventLoggerTest {

    private final AuthEventLogger authEventLogger = new AuthEventLogger();

    @Test
    void hashForLogNormalizesWithoutExposingOriginalValue() {
        String hash = authEventLogger.hashForLog("  Player@Example.COM  ");

        assertThat(hash).hasSize(12);
        assertThat(hash).doesNotContain("Player");
        assertThat(hash).isEqualTo(authEventLogger.hashForLog("player@example.com"));
    }
}
