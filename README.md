# Simple ARPG Prototype

This repository contains a small top-down action RPG prototype inspired by Path of Exile, with a much smaller scope and simpler visuals.

## Stack

- `frontend/`: React + TypeScript + Vite + Phaser 4
- `backend/`: Spring Boot + Java + PostgreSQL + JWT
- long-term mobile path: web-first with future Android packaging through Capacitor

## Current Prototype

The current build already includes:

- account register/login
- character creation with stat allocation
- saved character progression
- one arena-style combat loop with automatic spell casting
- enemy spawning, movement, damage, death, loot, gold, and experience
- centralized balance config
- map progression with `Training Grounds` plus consumable tier maps
- `Map Shards` and early map crafting
- equipment, inventory, selling, and a simple shop
- FF7-inspired spell/support slot UI
- spell progression with saved spell levels and upgrade costs
- compact mobile-first menus and pickers

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

The project now uses one standard local workflow from the repo root.

Start or restart everything:

```powershell
.\start-dev.ps1
```

Clean and start everything:

```powershell
.\clean-start-dev.ps1
```

Stop everything:

```powershell
.\stop-dev.ps1
```

What `start-dev.ps1` does:

- stops listeners on ports `5173` and `8080`
- clears tracked process ids
- starts frontend and backend in the background
- optionally runs `mvn clean spring-boot:run` for the backend
- writes logs to:
  - `.run/frontend.log`
  - `.run/frontend.error.log`
  - `.run/backend.log`
  - `.run/backend.error.log`

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

Backend runs through Spring Boot from the shared startup script. If backend persistence changes were added, restart the backend so Flyway can apply new migrations.

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
- evolve persistence contracts safely
- use AI as a development accelerator without losing control of design decisions

The main project instructions for future AI agents live in:

- [AGENTS.md](/C:/Users/danie/Documents/New%20project/AGENTS.md)

## Important Files

- [AGENTS.md](/C:/Users/danie/Documents/New%20project/AGENTS.md)
- [start-dev.ps1](/C:/Users/danie/Documents/New%20project/start-dev.ps1)
- [clean-start-dev.ps1](/C:/Users/danie/Documents/New%20project/clean-start-dev.ps1)
- [stop-dev.ps1](/C:/Users/danie/Documents/New%20project/stop-dev.ps1)
- [frontend/src/game/config/balanceConfig.ts](/C:/Users/danie/Documents/New%20project/frontend/src/game/config/balanceConfig.ts)
- [frontend/src/game/config/spellConfig.ts](/C:/Users/danie/Documents/New%20project/frontend/src/game/config/spellConfig.ts)
- [frontend/src/game/domain/combat/arenaSimulation.ts](/C:/Users/danie/Documents/New%20project/frontend/src/game/domain/combat/arenaSimulation.ts)
- [backend/src/main/resources/db/migration](/C:/Users/danie/Documents/New%20project/backend/src/main/resources/db/migration)

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
