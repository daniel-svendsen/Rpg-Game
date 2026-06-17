package com.shardborne.auth;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

@ConfigurationProperties(prefix = "app.auth.rate-limit")
public class AuthRateLimitProperties {

    private final Register register = new Register();

    public Register getRegister() {
        return register;
    }

    public static class Register {
        private boolean enabled = true;
        private int maxAttemptsPerIp = 10;
        private int maxAttemptsPerEmail = 5;
        private Duration window = Duration.ofMinutes(1);

        public boolean isEnabled() {
            return enabled;
        }

        public void setEnabled(boolean enabled) {
            this.enabled = enabled;
        }

        public int getMaxAttemptsPerIp() {
            return maxAttemptsPerIp;
        }

        public void setMaxAttemptsPerIp(int maxAttemptsPerIp) {
            this.maxAttemptsPerIp = maxAttemptsPerIp;
        }

        public int getMaxAttemptsPerEmail() {
            return maxAttemptsPerEmail;
        }

        public void setMaxAttemptsPerEmail(int maxAttemptsPerEmail) {
            this.maxAttemptsPerEmail = maxAttemptsPerEmail;
        }

        public Duration getWindow() {
            return window;
        }

        public void setWindow(Duration window) {
            this.window = window;
        }
    }
}
