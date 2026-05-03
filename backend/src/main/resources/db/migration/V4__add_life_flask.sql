alter table character_profile
    add column life_flask jsonb not null default '{"currentCharges":18}'::jsonb;
