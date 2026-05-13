# AI Context

## Product
- Shardborne is a small web-first ARPG prototype with persistent progression.
- Core loop: run maps, kill packs, collect loot/currency/maps, upgrade build, repeat.

## Important Domains
- Combat and spells.
- Items, rarity, and drops.
- Map progression and sustain.
- Character persistence (inventory, gear, spells, supports, map progress, currencies, life flask).
- Auth and character ownership.

## Critical Flows
- Register/login -> JWT -> authorized character APIs.
- Create/load character -> play loop -> save progression.
- Frontend domain computes gameplay rules; backend persists validated progression contracts.
- Simulator (`frontend` scripts) supports balance tuning without Phaser rendering.

## Boundaries
- Gameplay truth: `frontend/src/game/domain`.
- Rendering only: `frontend/src/game/phaser`.
- Balance/content config: `frontend/src/game/config`.
- Persistence/API authority: `backend/src/main/java/com/example/arpg`.

## External Services And Env Vars
- Database: `APP_DATABASE_URL`, `APP_DATABASE_USERNAME`, `APP_DATABASE_PASSWORD`.
- JWT: `APP_JWT_SECRET`, `APP_JWT_EXPIRATION_SECONDS`.
- Backend origin/CORS: `APP_CLIENT_ALLOWED_ORIGIN_PATTERNS`.
- Backend bind/port: `APP_SERVER_ADDRESS`, `APP_PORT`.
- Frontend API base: `VITE_API_BASE_URL`, optional `VITE_BASE_PATH`.
- Docker/demo helpers may use `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`.
