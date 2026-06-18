package com.shardborne.auth;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;

@Service
public class AuthClientAddressResolver {

    private static final String UNKNOWN_CLIENT = "unknown";

    private final AuthClientAddressProperties properties;

    public AuthClientAddressResolver(AuthClientAddressProperties properties) {
        this.properties = properties;
    }

    public String resolve(HttpServletRequest request) {
        if (properties.isTrustForwardHeaders()) {
            String forwardedFor = request.getHeader("X-Forwarded-For");
            if (forwardedFor != null && !forwardedFor.isBlank()) {
                return forwardedFor.split(",", 2)[0].trim();
            }
        }

        String remoteAddress = request.getRemoteAddr();
        return remoteAddress == null || remoteAddress.isBlank() ? UNKNOWN_CLIENT : remoteAddress;
    }
}
