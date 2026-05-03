alter table character_profile
    add column spell_progress jsonb not null default '[]'::jsonb;
