package com.shardborne.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.util.unit.DataSize;

@ConfigurationProperties(prefix = "app.request-size")
public class RequestSizeLimitProperties {

    private DataSize authJsonMax = DataSize.ofKilobytes(16);
    private DataSize apiJsonMax = DataSize.ofMegabytes(1);

    public DataSize getAuthJsonMax() {
        return authJsonMax;
    }

    public void setAuthJsonMax(DataSize authJsonMax) {
        this.authJsonMax = authJsonMax;
    }

    public DataSize getApiJsonMax() {
        return apiJsonMax;
    }

    public void setApiJsonMax(DataSize apiJsonMax) {
        this.apiJsonMax = apiJsonMax;
    }
}
