package com.shardborne.auth;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

@ConfigurationProperties(prefix = "app.auth.rate-limit")
public class AuthRateLimitProperties {

    private final Register register = new Register();
    private final Login login = new Login();

    public Register getRegister() {
        return register;
    }

    public Login getLogin() {
        return login;
    }

    public static class Register extends AttemptLimits {
        public Register() {
            setMaxAttemptsPerIp(10);
            setMaxAttemptsPerEmail(5);
        }
    }

    public static class Login extends AttemptLimits {
        public Login() {
            setMaxAttemptsPerIp(8);
            setMaxAttemptsPerEmail(5);
        }
    }

    public static class AttemptLimits {
        private boolean enabled = true;
        private int maxAttemptsPerIp;
        private int maxAttemptsPerEmail;
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
