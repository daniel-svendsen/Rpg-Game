create table user_account (
    id bigserial primary key,
    email varchar(255) not null unique,
    password_hash varchar(255) not null,
    created_at timestamp not null default current_timestamp
);

create table character_profile (
    id bigserial primary key,
    user_id bigint not null unique references user_account(id) on delete cascade,
    name varchar(100) not null,
    level integer not null,
    experience integer not null,
    experience_to_next_level integer not null,
    unspent_stat_points integer not null,
    current_health integer not null,
    gold integer not null,
    base_stats jsonb not null,
    derived_stats jsonb not null,
    inventory jsonb not null,
    equipped_items jsonb not null,
    unlocked_spell_ids jsonb not null,
    spell_loadout jsonb not null,
    currencies jsonb not null,
    map_progress jsonb not null,
    created_at timestamp not null default current_timestamp,
    updated_at timestamp not null default current_timestamp
);

