package com.example.arpg.auth;

import com.example.arpg.character.CharacterProfileService;
import com.example.arpg.character.CharacterResponse;
import com.example.arpg.user.UserAccountEntity;
import com.example.arpg.user.UserAccountRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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
        when(characterProfileService.getCurrentCharacter(anyString())).thenAnswer(invocation -> new CharacterResponse(
                42L,
                "Warden",
                4,
                50,
                120,
                1,
                100,
                75,
                Map.of("currentCharges", 18),
                Map.of("strength", 2, "agility", 2, "vitality", 2, "dexterity", 2),
                Map.of("maxHealth", 100, "castSpeedMultiplier", 1.0, "critChance", 0.01, "spellPowerMultiplier", 1.0),
                List.of(),
                Map.of(),
                List.of("stormChain", "emberBurst"),
                List.of("fasterCasting"),
                List.of(Map.of("spellId", "stormChain", "level", 1)),
                List.of(Map.of("mainSpellId", "stormChain", "supportSpellIds", List.of())),
                List.of(),
                Map.of("highestUnlockedTier", 0, "lastCompletedTier", 0, "consumableMaps", List.of())
        ));
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

        mockMvc.perform(get("/api/characters/me")
                        .header("Authorization", "Bearer " + registerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Warden"))
                .andExpect(jsonPath("$.id").value(42));

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

        mockMvc.perform(get("/api/characters/me")
                        .header("Authorization", "Bearer " + loginToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.unlockedSpellIds[0]").value("stormChain"));

        verify(characterProfileService, times(2)).getCurrentCharacter("player@example.com");
    }

    @Test
    void protectedCharacterEndpointRejectsMissingToken() throws Exception {
        mockMvc.perform(get("/api/characters/me"))
                .andExpect(status().isForbidden());
    }
}
