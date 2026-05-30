package com.shardborne.api;

import com.shardborne.auth.AuthException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(AuthException.class)
    public ResponseEntity<ApiErrorResponse> handleAuthException(AuthException exception) {
        return ResponseEntity.status(exception.getStatus()).body(
                new ApiErrorResponse(
                        exception.getCode(),
                        exception.getMessage(),
                        Map.of()
                )
        );
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidationException(MethodArgumentNotValidException exception) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();

        for (FieldError fieldError : exception.getBindingResult().getFieldErrors()) {
            fieldErrors.putIfAbsent(fieldError.getField(), resolveFieldMessage(fieldError));
        }

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                new ApiErrorResponse(
                        "INVALID_REQUEST",
                        "Please correct the highlighted fields.",
                        fieldErrors
                )
        );
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ApiErrorResponse> handleResponseStatusException(ResponseStatusException exception) {
        String message = exception.getReason() == null || exception.getReason().isBlank()
                ? "Request failed."
                : exception.getReason();

        return ResponseEntity.status(exception.getStatusCode()).body(
                new ApiErrorResponse(
                        "REQUEST_FAILED",
                        message,
                        Map.of()
                )
        );
    }

    private String resolveFieldMessage(FieldError fieldError) {
        return switch (fieldError.getField()) {
            case "email" -> switch (fieldError.getCode()) {
                case "NotBlank" -> "Email is required.";
                case "Email" -> "Enter a valid email address.";
                default -> "Check the email address.";
            };
            case "password" -> switch (fieldError.getCode()) {
                case "NotBlank" -> "Password is required.";
                case "Size" -> "Password must be between 8 and 100 characters.";
                default -> "Check the password.";
            };
            default -> fieldError.getDefaultMessage() == null || fieldError.getDefaultMessage().isBlank()
                    ? "Invalid value."
                    : fieldError.getDefaultMessage();
        };
    }
}
