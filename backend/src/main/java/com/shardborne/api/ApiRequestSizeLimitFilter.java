package com.shardborne.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shardborne.config.RequestSizeLimitProperties;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.Set;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class ApiRequestSizeLimitFilter extends OncePerRequestFilter {

    private static final Set<String> BODY_METHODS = Set.of("POST", "PUT", "PATCH");

    private final RequestSizeLimitProperties properties;
    private final ObjectMapper objectMapper;

    public ApiRequestSizeLimitFilter(RequestSizeLimitProperties properties, ObjectMapper objectMapper) {
        this.properties = properties;
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        long contentLength = request.getContentLengthLong();
        if (!isLimitedApiRequest(request) || contentLength < 0) {
            filterChain.doFilter(request, response);
            return;
        }

        long maxBytes = resolveMaxBytes(request);
        if (contentLength > maxBytes) {
            writePayloadTooLarge(response, maxBytes);
            return;
        }

        filterChain.doFilter(request, response);
    }

    private boolean isLimitedApiRequest(HttpServletRequest request) {
        return BODY_METHODS.contains(request.getMethod()) && request.getRequestURI().startsWith("/api/");
    }

    private long resolveMaxBytes(HttpServletRequest request) {
        if (request.getRequestURI().startsWith("/api/auth/")) {
            return properties.getAuthJsonMax().toBytes();
        }

        return properties.getApiJsonMax().toBytes();
    }

    private void writePayloadTooLarge(HttpServletResponse response, long maxBytes) throws IOException {
        response.setStatus(HttpStatus.PAYLOAD_TOO_LARGE.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        objectMapper.writeValue(
                response.getWriter(),
                new ApiErrorResponse(
                        "REQUEST_TOO_LARGE",
                        "Request body is too large. Maximum allowed size is " + maxBytes + " bytes.",
                        Map.of()
                )
        );
    }
}
