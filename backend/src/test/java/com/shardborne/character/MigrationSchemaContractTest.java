package com.shardborne.character;

import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;

class MigrationSchemaContractTest {

    @Test
    void migrationScriptsCoverPhaseOneSaveFields() throws IOException {
        String v1 = Files.readString(Path.of("src/main/resources/db/migration/V1__init.sql"));
        String v2 = Files.readString(Path.of("src/main/resources/db/migration/V2__add_unlocked_support_spells.sql"));
        String v3 = Files.readString(Path.of("src/main/resources/db/migration/V3__add_spell_progress.sql"));
        String v4 = Files.readString(Path.of("src/main/resources/db/migration/V4__add_life_flask.sql"));

        assertThat(v1).contains("create table character_profile");
        assertThat(v1).contains("base_stats jsonb not null");
        assertThat(v1).contains("derived_stats jsonb not null");
        assertThat(v1).contains("inventory jsonb not null");
        assertThat(v1).contains("equipped_items jsonb not null");
        assertThat(v1).contains("unlocked_spell_ids jsonb not null");
        assertThat(v1).contains("spell_loadout jsonb not null");
        assertThat(v1).contains("currencies jsonb not null");
        assertThat(v1).contains("map_progress jsonb not null");
        assertThat(v2).contains("add column unlocked_support_spell_ids jsonb not null");
        assertThat(v3).contains("add column spell_progress jsonb not null");
        assertThat(v4).contains("add column life_flask jsonb not null");
    }
}
