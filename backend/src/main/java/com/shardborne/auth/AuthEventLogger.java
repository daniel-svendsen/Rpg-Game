package com.shardborne.auth;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.Locale;

@Service
public class AuthEventLogger {

    private static final Logger LOGGER = LoggerFactory.getLogger(AuthEventLogger.class);

    private final AuthClientAddressResolver clientAddressResolver;

    public AuthEventLogger(AuthClientAddressResolver clientAddressResolver) {
        this.clientAddressResolver = clientAddressResolver;
    }

    public void failedLogin(HttpServletRequest request, String email) {
        LOGGER.warn(
                "auth_event=failed_login clientHash={} emailHash={}",
                hashForLog(resolveClientAddress(request)),
                hashForLog(normalizeEmail(email))
        );
    }

    public void loginRateLimited(HttpServletRequest request, String email) {
        LOGGER.warn(
                "auth_event=login_rate_limited clientHash={} emailHash={}",
                hashForLog(resolveClientAddress(request)),
                hashForLog(normalizeEmail(email))
        );
    }

    public void registerRateLimited(HttpServletRequest request, String email) {
        LOGGER.warn(
                "auth_event=register_rate_limited clientHash={} emailHash={}",
                hashForLog(resolveClientAddress(request)),
                hashForLog(normalizeEmail(email))
        );
    }

    public void duplicateRegistration(String email) {
        LOGGER.warn("auth_event=duplicate_registration emailHash={}", hashForLog(normalizeEmail(email)));
    }

    public void unexpectedAuthError(HttpServletRequest request, String email, String action) {
        LOGGER.error(
                "auth_event=unexpected_auth_error action={} clientHash={} emailHash={}",
                action,
                hashForLog(resolveClientAddress(request)),
                hashForLog(normalizeEmail(email))
        );
    }

    String hashForLog(String value) {
        String normalized = value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(normalized.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash, 0, 6);
        } catch (NoSuchAlgorithmException exception) {
            return "hash-unavailable";
        }
    }

    private String resolveClientAddress(HttpServletRequest request) {
        return clientAddressResolver.resolve(request);
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }
}
