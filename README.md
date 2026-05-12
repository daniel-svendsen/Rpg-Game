# Shardborne

This repository contains Shardborne, a small top-down action RPG inspired by Path of Exile, with a much smaller scope and simpler visuals.

## Roadmap And Progress

Project planning and phased progress are tracked in:

- [ROADMAP.md](ROADMAP.md)

That file defines:

- the current project phase
- backend acceptance goals
- what is intentionally deferred
- the next recommended step

## Stack

- `frontend/`: React + TypeScript + Vite + Phaser 4
- `backend/`: Spring Boot + Java + PostgreSQL + JWT
- long-term mobile path: web-first with future Android packaging through Capacitor

## Deployment Guide

For exact demo and deployment steps, use:

- [DEPLOYMENT.md](DEPLOYMENT.md)

That file covers:

- Cloudflare Pages setup
- Quick Tunnel demo flow
- named Cloudflare Tunnel flow with a stable hostname
- what needs restarting after frontend or backend changes
- which local files should stay out of Git

## Additional Docs

- [docs/INDEX.md](docs/INDEX.md)
- [docs/PROJECT_VISION.md](docs/PROJECT_VISION.md)
- [docs/SIMULATION.md](docs/SIMULATION.md)
- [docs/COMMANDS.md](docs/COMMANDS.md)
- [docs/SYSTEM_FLOWCHARTS.md](docs/SYSTEM_FLOWCHARTS.md)
- [docs/VISUALS.md](docs/VISUALS.md)
- [docs/ASSET_MAPPING.md](docs/ASSET_MAPPING.md)

## Project Structure

- `frontend/src/app`: React screen composition, hub flow, persistence orchestration, and mobile-first UI state
- `frontend/src/game/domain`: gameplay source of truth for combat, progression, maps, items, spells, and player rules
- `frontend/src/game/config`: centralized balance and content config for maps, monsters, spells, items, and economy
- `frontend/src/game/phaser`: rendering adapter that turns arena snapshots into visuals
- `frontend/src/api`: frontend API client helpers and auth/game requests
- `frontend/src/shared`: shared frontend utility and save-related types
- `backend/src/main/java/com/example/arpg/auth`: auth endpoints and auth service flow
- `backend/src/main/java/com/example/arpg/character`: character APIs, save DTOs, persistence mapping, and stat calculation
- `backend/src/main/java/com/example/arpg/security`: JWT and request security setup
- `backend/src/main/resources/db/migration`: Flyway migrations for persistent save and account data
- repo root scripts: `start-dev.ps1`, `clean-start-dev.ps1`, and `stop-dev.ps1` are the standard local workflow entrypoints

## Current Prototype

The current build already includes:

- account register/login
- character creation with stat allocation
- saved character progression
- shared frontend domain tests for progression and save-related flows
- one arena-style combat loop with automatic spell casting
- enemy spawning, movement, damage, death, loot, gold, and experience
- centralized balance config
- map progression with `Training Grounds` plus consumable tier maps
- `Map Shards` and early map crafting
- equipment, inventory, selling, and a simple shop
- FF7-inspired spell/support slot UI
- spell progression with saved spell levels and upgrade costs
- compact mobile-first menus and pickers
- session and autosave guardrails around arena runtime updates and character persistence

## Combat And Progression

Some important gameplay rules already implemented:

- spells show concrete stats such as damage, cooldown, crit chance, chain behavior, and area behavior
- `Storm Chain` uses actual chain targeting logic with a chain range, not just flavor text
- spells can be upgraded with scaling gold costs and later shard requirements
- new spell levels are saved as part of character progression
- gear drops are intentionally toned down compared to earlier iterations
- gold, shop prices, and shop item power are tuned together instead of independently
- healing is now built around a simple life flask system:
  - full heal and full flask refill when a new map starts
  - life flask charges are gained from kills
  - the flask is used actively and saved as part of character progression

## Local Setup

1. Copy `dev.local.properties.example` to `dev.local.properties`
2. Set your real PostgreSQL password in `dev.local.properties`
3. Optional for custom frontend API targeting:
   copy `frontend/.env.example` to `frontend/.env` and set `VITE_API_BASE_URL`
4. Make sure PostgreSQL is available locally

Manual step for me:

- create the PostgreSQL database if it does not already exist
- provide real local secrets and environment values

## How To Test

This project is set up so another developer or recruiter can test it locally with a small number of steps.

1. Clone the repository
2. Create a local PostgreSQL database named `simple_arpg`
3. Copy `dev.local.properties.example` to `dev.local.properties`
4. Set local values:
   - `APP_DATABASE_PASSWORD`
   - `APP_JWT_SECRET`
5. Run:

```powershell
.\clean-start-dev.ps1
```

6. Open the frontend in the browser:

```text
http://localhost:5173
```

7. Register a new account and create a character
8. Start with `Training Grounds` and test:
   - automatic combat
   - spell selection and linked supports
   - spell upgrades
   - life flask charges from kills
   - equipment drops, selling, and the shop
   - map progression and shard crafting

If something fails to start, check:

- `.run/frontend.error.log`
- `.run/backend.error.log`

## Start And Stop

Use the repo-root scripts:

- `.\start-dev.ps1`
- `.\clean-start-dev.ps1`
- `.\stop-dev.ps1`
- `.\start-dev-against-demo.ps1`

For what each command does and when to use it:

- [docs/COMMANDS.md](docs/COMMANDS.md)

## Git And Secrets

Do not commit local secrets.

Ignored local-only files already include:

- `dev.local.properties`
- `frontend/.env`
- `backend/.env`
- `.run/`
- `.m2/`

Recommended Git flow:

1. Review local config files and make sure secrets only exist in ignored files
2. Stage project files
3. Commit
4. Add a remote
5. Push

Manual step for me:

If `dev.local.properties` was already tracked before `.gitignore` was fixed, untrack it once:

```powershell
git rm --cached dev.local.properties
```

Then commit the `.gitignore` change.

If this repository is not yet connected to GitHub, add a remote like this:

```powershell
git remote add origin https://github.com/<your-user>/<your-repo>.git
git branch -M main
git push -u origin main
```

If Git warns about "dubious ownership" on this machine, mark the repo as safe once:

```powershell
git config --global --add safe.directory "C:/Users/danie/Documents/New project"
```

## Build And Verification

Frontend production build:

```powershell
cd frontend
npm run build
```

Frontend domain tests:

```powershell
cd frontend
npm test
```

Frontend app guardrail tests now also cover arena session timing and autosave decision logic through the shared `vitest` run above.

Backend automated tests:

```powershell
cd backend
mvn test
```

Backend runs through Spring Boot from the shared startup script. If backend persistence changes were added, restart the backend so Flyway can apply new migrations.

Fresh database startup verification:

```powershell
.\verify-fresh-backend-db.ps1
```

That script creates a temporary PostgreSQL database from your local `dev.local.properties`, starts the backend against that empty database, verifies that Flyway migrations were applied, and then drops the temporary database again.

For the full simulation workflow and report interpretation:

- [docs/SIMULATION.md](docs/SIMULATION.md)

## Persistence Notes

Character saves currently include:

- stats
- level and experience
- gold
- inventory and equipped items
- unlocked spells
- unlocked supports
- spell progression levels
- spell loadout links
- life flask charges
- currencies
- map progression

The backend uses a hybrid persistence approach:

- relational rows for account and character ownership
- JSONB for flexible early-game state sections

If save shape changes again, update:

- frontend save types
- frontend normalization
- backend DTOs
- backend entity mapping
- Flyway migrations

## AI-Assisted Development

This project is intentionally built as an AI-assisted portfolio project.

The goal is not just to show game features, but also to show that I can:

- define architecture and guardrails for AI-assisted coding
- keep gameplay rules centralized and maintainable
- separate rendering from domain logic
- keep large UI flows split into focused React components instead of one oversized app shell
- evolve persistence contracts safely
- use AI as a development accelerator without losing control of design decisions

The main project instructions for future AI agents live in:

- [AGENTS.md](AGENTS.md)
- [frontend/AGENTS.md](frontend/AGENTS.md)
- [backend/AGENTS.md](backend/AGENTS.md)
- [ROADMAP.md](ROADMAP.md)
- [docs/SYSTEM_FLOWCHARTS.md](docs/SYSTEM_FLOWCHARTS.md)

## Important Files

- [AGENTS.md](AGENTS.md)
- [start-dev.ps1](start-dev.ps1)
- [clean-start-dev.ps1](clean-start-dev.ps1)
- [stop-dev.ps1](stop-dev.ps1)
- [frontend/src/app/App.tsx](frontend/src/app/App.tsx)
- [frontend/src/app/appUiHelpers.ts](frontend/src/app/appUiHelpers.ts)
- [frontend/src/app/arenaSessionTiming.ts](frontend/src/app/arenaSessionTiming.ts)
- [frontend/src/app/characterPersistence.ts](frontend/src/app/characterPersistence.ts)
- [frontend/src/app/useCharacterPersistence.ts](frontend/src/app/useCharacterPersistence.ts)
- [frontend/src/app/useMapActions.ts](frontend/src/app/useMapActions.ts)
- [frontend/src/app/useHubActions.ts](frontend/src/app/useHubActions.ts)
- [frontend/src/app/useArenaSession.ts](frontend/src/app/useArenaSession.ts)
- [frontend/src/game/config/balanceConfig.ts](frontend/src/game/config/balanceConfig.ts)
- [frontend/src/game/config/spellConfig.ts](frontend/src/game/config/spellConfig.ts)
- [frontend/src/game/domain/combat/arenaSimulation.ts](frontend/src/game/domain/combat/arenaSimulation.ts)
- [frontend/src/game/domain/maps/mapProgress.test.ts](frontend/src/game/domain/maps/mapProgress.test.ts)
- [frontend/src/game/domain/spells/spellProgression.test.ts](frontend/src/game/domain/spells/spellProgression.test.ts)
- [backend/src/main/resources/db/migration](backend/src/main/resources/db/migration)

## Future Android Packaging

The project already has some groundwork for future packaging:

- mobile-safe layout spacing
- web manifest
- starter Capacitor config
- backend CORS defaults for common Capacitor origins

Manual step for me:

1. Install Capacitor when ready:

```powershell
cd frontend
npm install -D @capacitor/cli
npm install @capacitor/core @capacitor/android
```

2. Initialize Android once:

```powershell
npx cap add android
```

3. Build and sync the web app into the Android shell:

```powershell
npm run build:mobile
npx cap sync android
```

4. Open Android Studio:

```powershell
npx cap open android
```
