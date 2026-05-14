ALTER TABLE character_profile
    ADD COLUMN passive_support_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN support_progress jsonb NOT NULL DEFAULT '[]'::jsonb;
