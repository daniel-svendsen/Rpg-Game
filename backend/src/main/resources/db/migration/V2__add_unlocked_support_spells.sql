alter table character_profile
    add column unlocked_support_spell_ids jsonb not null default '[]'::jsonb;
