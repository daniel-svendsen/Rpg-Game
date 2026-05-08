package com.example.arpg.auth;

import com.example.arpg.security.JwtService;
import com.example.arpg.user.UserAccountEntity;
import com.example.arpg.user.UserAccountRepository;
import com.example.arpg.user.UserPrincipalService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.http.HttpStatus.UNAUTHORIZED;
import static org.springframework.http.HttpStatus.CONFLICT;

@Service
public class AuthService {

    private final UserAccountRepository userAccountRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final UserPrincipalService userPrincipalService;

    public AuthService(
            UserAccountRepository userAccountRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            AuthenticationManager authenticationManager,
            UserPrincipalService userPrincipalService
    ) {
        this.userAccountRepository = userAccountRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
        this.userPrincipalService = userPrincipalService;
    }

    @Transactional
    public AuthResponse register(AuthRequest request) {
        if (userAccountRepository.existsByEmail(request.email())) {
            throw new AuthException(CONFLICT, "EMAIL_ALREADY_REGISTERED", "An account with this email already exists.");
        }

        UserAccountEntity user = new UserAccountEntity();
        user.setEmail(request.email());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        userAccountRepository.save(user);

        String token = jwtService.generateToken(userPrincipalService.loadUserByUsername(user.getEmail()));
        return new AuthResponse(token);
    }

    public AuthResponse login(AuthRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.email(), request.password())
            );
        } catch (AuthenticationException exception) {
            throw new AuthException(UNAUTHORIZED, "INVALID_CREDENTIALS", "Incorrect email or password.");
        }

        String token = jwtService.generateToken(userPrincipalService.loadUserByUsername(request.email()));
        return new AuthResponse(token);
    }
}

