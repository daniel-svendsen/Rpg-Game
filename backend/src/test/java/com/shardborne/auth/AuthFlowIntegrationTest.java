package com.shardborne.auth;

import com.shardborne.character.CharacterProfileService;
import com.shardborne.character.CharacterResponse;
import com.shardborne.character.CharacterSummaryResponse;
import com.shardborne.character.LifeFlaskState;
import com.shardborne.character.MapProgressData;
import com.shardborne.character.SpellLoadoutEntry;
import com.shardborne.character.SpellProgressState;
import com.shardborne.character.SupportProgressState;
import com.shardborne.user.UserAccountEntity;
import com.shardborne.user.UserAccountRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.autoconfigure.flyway.FlywayAutoConfiguration;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;
import org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration;
import org.springframework.boot.autoconfigure.data.jpa.JpaRepositoriesAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(
        properties = {
                "spring.autoconfigure.exclude="
                        + "org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration,"
                        + "org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration,"
                        + "org.springframework.boot.autoconfigure.flyway.FlywayAutoConfiguration,"
                        + "org.springframework.boot.autoconfigure.data.jpa.JpaRepositoriesAutoConfiguration"
        }
)
@AutoConfigureMockMvc
@EnableAutoConfiguration(exclude = {
        DataSourceAutoConfiguration.class,
        HibernateJpaAutoConfiguration.class,
        FlywayAutoConfiguration.class,
        JpaRepositoriesAutoConfiguration.class
})
class AuthFlowIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UserAccountRepository userAccountRepository;

    @MockBean
    private CharacterProfileService characterProfileService;

    private Map<String, UserAccountEntity> usersByEmail;

    @BeforeEach
    void setUp() {
        usersByEmail = new HashMap<>();

        when(userAccountRepository.existsByEmail(anyString()))
                .thenAnswer(invocation -> usersByEmail.containsKey(invocation.getArgument(0)));
        when(userAccountRepository.findByEmail(anyString()))
                .thenAnswer(invocation -> Optional.ofNullable(usersByEmail.get(invocation.getArgument(0))));
        when(userAccountRepository.save(any(UserAccountEntity.class))).thenAnswer(invocation -> {
            UserAccountEntity user = invocation.getArgument(0);
            usersByEmail.put(user.getEmail(), user);
            return user;
        });
        CharacterResponse fullCharacter = new CharacterResponse(
                42L,
                "TestChar",
                4,
                50,
                120,
                1,
                100,
                75,
                new LifeFlaskState(18),
                Map.of("strength", 2, "agility", 2, "vitality", 2, "dexterity", 2, "intelligence", 2),
                Map.of("maxHealth", 100, "castSpeedMultiplier", 1.0, "critChance", 0.01, "spellPowerMultiplier", 1.0),
                List.of(),
                Map.of(),
                List.of("stormChain", "emberBurst"),
                List.of("fasterCasting"),
                List.of(),
                List.of(new SpellProgressState("stormChain", 1)),
                List.of(new SupportProgressState("fasterCasting", 1)),
                List.of(new SpellLoadoutEntry("stormChain", List.of())),
                List.of(),
                new MapProgressData(1, 0, List.of(), List.of())
        );
        when(characterProfileService.listCharacters(anyString()))
                .thenReturn(List.of(new CharacterSummaryResponse(42L, "TestChar", 4, Instant.now())));
        when(characterProfileService.getCharacterById(anyString(), any()))
                .thenReturn(fullCharacter);
    }

    @Test
    void registerLoginAndJwtProtectedCharacterLoadWork() throws Exception {
        String registerResponse = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "player@example.com",
                                  "password": "password123"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode registerJson = objectMapper.readTree(registerResponse);
        String registerToken = registerJson.get("token").asText();
        assertThat(registerToken).isNotBlank();

        mockMvc.perform(get("/api/characters")
                        .header("Authorization", "Bearer " + registerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("TestChar"))
                .andExpect(jsonPath("$[0].id").value(42));

        String loginResponse = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "player@example.com",
                                  "password": "password123"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode loginJson = objectMapper.readTree(loginResponse);
        String loginToken = loginJson.get("token").asText();
        assertThat(loginToken).isNotBlank();

        mockMvc.perform(get("/api/characters/42")
                        .header("Authorization", "Bearer " + loginToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.unlockedSpellIds[0]").value("stormChain"));

        verify(characterProfileService, times(1)).listCharacters("player@example.com");
        verify(characterProfileService, times(1)).getCharacterById("player@example.com", 42L);
    }

    @Test
    void protectedCharacterEndpointRejectsMissingToken() throws Exception {
        mockMvc.perform(get("/api/characters"))
                .andExpect(status().isForbidden());
    }

    @Test
    void duplicateRegistrationReturnsClearConflictMessage() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "player@example.com",
                                  "password": "password123"
                                }
                                """))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "player@example.com",
                                  "password": "password123"
                                }
                                """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("EMAIL_ALREADY_REGISTERED"))
                .andExpect(jsonPath("$.message").value("An account with this email already exists."));
    }

    @Test
    void invalidLoginReturnsClearUnauthorizedMessage() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "player@example.com",
                                  "password": "password123"
                                }
                                """))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "player@example.com",
                                  "password": "wrongpass123"
                                }
                                """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("INVALID_CREDENTIALS"))
                .andExpect(jsonPath("$.message").value("Incorrect email or password."));
    }

    @Test
    void invalidRegistrationPayloadReturnsFieldErrors() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "not-an-email",
                                  "password": "short"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_REQUEST"))
                .andExpect(jsonPath("$.message").value("Please correct the highlighted fields."))
                .andExpect(jsonPath("$.fieldErrors.email").value("Enter a valid email address."))
                .andExpect(jsonPath("$.fieldErrors.password").value("Password must be between 8 and 100 characters."));
    }

    @Test
    void registrationSucceedsEvenWhenExpiredTokenSentInHeader() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + buildExpiredToken("stale@example.com"))
                        .content("""
                                {
                                  "email": "new@example.com",
                                  "password": "password123"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString());
    }

    @Test
    void expiredTokenOnProtectedEndpointReturnsForbiddenNotServerError() throws Exception {
        mockMvc.perform(get("/api/characters/me")
                        .header("Authorization", "Bearer " + buildExpiredToken("stale@example.com")))
                .andExpect(status().isForbidden());
    }

    private String buildExpiredToken(String email) {
        Instant past = Instant.now().minusSeconds(3600);
        byte[] keyBytes = "change-this-secret-before-production".getBytes(StandardCharsets.UTF_8);
        return Jwts.builder()
                .subject(email)
                .issuedAt(Date.from(past.minusSeconds(86400)))
                .expiration(Date.from(past))
                .signWith(Keys.hmacShaKeyFor(keyBytes))
                .compact();
    }
}
