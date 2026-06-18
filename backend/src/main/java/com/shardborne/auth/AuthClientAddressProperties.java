package com.shardborne.auth;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.auth.client-address")
public class AuthClientAddressProperties {

    private boolean trustForwardHeaders = false;

    public boolean isTrustForwardHeaders() {
        return trustForwardHeaders;
    }

    public void setTrustForwardHeaders(boolean trustForwardHeaders) {
        this.trustForwardHeaders = trustForwardHeaders;
    }
}
