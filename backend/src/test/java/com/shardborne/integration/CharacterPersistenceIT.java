package com.shardborne.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.io.IOException;
import java.sql.SQLException;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class CharacterPersistenceIT {

    private static TemporaryPostgresDatabase testDatabase;

    static {
        try {
            testDatabase = TemporaryPostgresDatabase.createFromLocalConfig();
        } catch (IOException | SQLException exception) {
            testDatabase = null;
        }
    }

    @DynamicPropertySource
    static void registerProperties(DynamicPropertyRegistry registry) {
        Assumptions.assumeTrue(testDatabase != null, "Skipping DB integration test because local PostgreSQL test config is unavailable.");
        registry.add("spring.datasource.url", testDatabase::getDatabaseJdbcUrl);
        registry.add("spring.datasource.username", testDatabase::getUsername);
        registry.add("spring.datasource.password", testDatabase::getPassword);
        registry.add("app.jwt.secret", testDatabase::getJwtSecret);
        registry.add("app.jwt.expiration-seconds", () -> 86400);
    }

    @AfterAll
    static void tearDownDatabase() throws SQLException {
        if (testDatabase != null) {
            testDatabase.dropDatabase();
        }
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void registerCreateCharacterAndLoadCurrentCharacterAgainstRealDatabase() throws Exception {
        String email = "it-" + UUID.randomUUID().toString().substring(0, 8) + "@example.com";
        String password = "password123";

        String registerResponse = mockMvc.perform(post("/api/auth/register")
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new AuthPayload(email, password))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString())
                .andReturn()
                .getResponse()
                .getContentAsString();

        String token = extractToken(registerResponse);

        String createCharacterResponse = mockMvc.perform(post("/api/characters")
                        .header("Authorization", "Bearer " + token)
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Integration Warden",
                                  "baseStats": {
                                    "strength": 2,
                                    "agility": 1,
                                    "vitality": 3,
                                    "dexterity": 0,
                                    "intelligence": 0
                                  }
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Integration Warden"))
                .andExpect(jsonPath("$.lifeFlask.currentCharges").value(18))
                .andExpect(jsonPath("$.unlockedSpellIds[0]").value("stormChain"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode createdCharacter = objectMapper.readTree(createCharacterResponse);
        long characterId = createdCharacter.get("id").asLong();
        assertThat(characterId).isPositive();

        mockMvc.perform(get("/api/characters/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(characterId))
                .andExpect(jsonPath("$.name").value("Integration Warden"))
                .andExpect(jsonPath("$.baseStats.strength").value(2))
                .andExpect(jsonPath("$.mapProgress.highestUnlockedTier").value(1));
    }

    private String extractToken(String registerResponse) throws IOException {
        return objectMapper.readTree(registerResponse).get("token").asText();
    }

    private record AuthPayload(String email, String password) {
    }
}
