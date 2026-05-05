# Simple ARPG Prototype

This repository contains a small top-down action RPG prototype inspired by Path of Exile, with a much smaller scope and simpler visuals.

## Stack

- `frontend/`: React + TypeScript + Vite + Phaser 4
- `backend/`: Spring Boot + Java + PostgreSQL + JWT
- long-term mobile path: web-first with future Android packaging through Capacitor

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

## Docker Backend Demo

If you want a free demo setup without paying for backend hosting, you can run the backend and PostgreSQL locally with Docker and keep the frontend static elsewhere.

1. Copy `compose.env.example` to `.env`
2. Set at least:
   - `POSTGRES_PASSWORD`
   - `APP_JWT_SECRET`
3. Start backend and database:

```powershell
docker compose up --build -d
```

4. The backend will be available on:

```text
http://localhost:8080
```

5. Stop the containers when you are done:

```powershell
docker compose down
```

6. If you also want to remove the local PostgreSQL volume:

```powershell
docker compose down -v
```

Notes:

- this is meant for local development and free demo sharing
- the backend only stays available while your computer is on and the containers are running
- Flyway migrations still run automatically on backend startup
- if you deploy the frontend separately, build it with `VITE_API_BASE_URL` pointing to the public backend URL you want to use

## Share A Free Demo

One cheap path is:

1. Host the frontend on `GitHub Pages` or `Cloudflare Pages`
2. Run `backend + postgres` locally through Docker
3. Expose the backend temporarily with Cloudflare Tunnel
4. Build the frontend with that public backend URL

Quick temporary backend sharing example:

```powershell
cloudflared tunnel --url http://localhost:8080
```

That gives you a temporary public backend URL on `trycloudflare.com`. Use that URL as `VITE_API_BASE_URL` when building the frontend for your colleague.

Notes:

- Quick Tunnels are great for temporary testing but the URL changes when restarted
- for a stable public URL later, use a named Cloudflare Tunnel and your own domain
- make sure `APP_CLIENT_ALLOWED_ORIGIN_PATTERNS` includes the real frontend origin you share

## Static Frontend Deploy

The frontend can now be built for static hosting with:

```powershell
cd frontend
npm run build
```

Optional environment variables:

- `VITE_API_BASE_URL`: the public backend URL to call from the deployed frontend
- `VITE_BASE_PATH`: the base path for static hosts that serve the app under a subpath such as `/repo-name/`

Example for a GitHub Pages-style build:

```powershell
cd frontend
$env:VITE_API_BASE_URL="https://your-backend-url.trycloudflare.com"
$env:VITE_BASE_PATH="/your-repo-name/"
npm run build:pages
```

### GitHub Pages

A workflow is included at:

- [deploy-frontend-pages.yml](/C:/Users/danie/Documents/New%20project/.github/workflows/deploy-frontend-pages.yml)

To use it:

1. Push the repository to GitHub
2. In the GitHub repository settings, enable Pages with `GitHub Actions` as the source
3. Add a repository variable named `VITE_API_BASE_URL` with your public backend URL
4. Push to `main` or run the workflow manually

Notes:

- the workflow builds the frontend from `frontend/`
- it automatically uses `/${repo-name}/` as the Pages base path
- if you later use a custom domain or a different hosting style, you may want to override the base path manually

### Cloudflare Pages

Suggested settings:

- Project root: `frontend`
- Build command: `npm run build`
- Output directory: `dist`
- Environment variable: `VITE_API_BASE_URL=https://your-backend-url`
- Optional environment variable: `VITE_BASE_PATH=/` 

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

## Test On Your Phone

Phone testing uses local-only overrides so the shared default backend config stays loopback-only.

1. Create or update `dev.local.properties` in the repo root:

```properties
APP_SERVER_ADDRESS=0.0.0.0
APP_CLIENT_ALLOWED_ORIGIN_PATTERNS=http://localhost:*,http://127.0.0.1:*,http://192.168.*:*,http://10.*:*,http://172.16.*:*,http://172.17.*:*,http://172.18.*:*,http://172.19.*:*,http://172.20.*:*,http://172.21.*:*,http://172.22.*:*,http://172.23.*:*,http://172.24.*:*,http://172.25.*:*,http://172.26.*:*,http://172.27.*:*,http://172.28.*:*,http://172.29.*:*,http://172.30.*:*,http://172.31.*:*,capacitor://localhost,ionic://localhost
```

2. Make sure your phone and computer are on the same WiFi
3. Start the project:

```powershell
.\clean-start-dev.ps1
```

4. Find your computer's local IP:

```powershell
ipconfig
```

Look for the IPv4 address, for example `192.168.1.25`

5. Open this in your phone browser:

```text
http://192.168.1.25:5173
```

The frontend will automatically call the backend on the same host at port `8080`, so you do not need to manually change `VITE_API_BASE_URL` just for phone testing unless you want to override it.

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

- [AGENTS.md](/C:/Users/danie/Documents/New%20project/AGENTS.md)

## Important Files

- [AGENTS.md](/C:/Users/danie/Documents/New%20project/AGENTS.md)
- [start-dev.ps1](/C:/Users/danie/Documents/New%20project/start-dev.ps1)
- [clean-start-dev.ps1](/C:/Users/danie/Documents/New%20project/clean-start-dev.ps1)
- [stop-dev.ps1](/C:/Users/danie/Documents/New%20project/stop-dev.ps1)
- [frontend/src/app/App.tsx](/C:/Users/danie/Documents/New%20project/frontend/src/app/App.tsx)
- [frontend/src/app/appUiHelpers.ts](/C:/Users/danie/Documents/New%20project/frontend/src/app/appUiHelpers.ts)
- [frontend/src/app/arenaSessionTiming.ts](/C:/Users/danie/Documents/New%20project/frontend/src/app/arenaSessionTiming.ts)
- [frontend/src/app/characterPersistence.ts](/C:/Users/danie/Documents/New%20project/frontend/src/app/characterPersistence.ts)
- [frontend/src/app/useCharacterPersistence.ts](/C:/Users/danie/Documents/New%20project/frontend/src/app/useCharacterPersistence.ts)
- [frontend/src/app/useMapActions.ts](/C:/Users/danie/Documents/New%20project/frontend/src/app/useMapActions.ts)
- [frontend/src/app/useHubActions.ts](/C:/Users/danie/Documents/New%20project/frontend/src/app/useHubActions.ts)
- [frontend/src/app/useArenaSession.ts](/C:/Users/danie/Documents/New%20project/frontend/src/app/useArenaSession.ts)
- [frontend/src/game/config/balanceConfig.ts](/C:/Users/danie/Documents/New%20project/frontend/src/game/config/balanceConfig.ts)
- [frontend/src/game/config/spellConfig.ts](/C:/Users/danie/Documents/New%20project/frontend/src/game/config/spellConfig.ts)
- [frontend/src/game/domain/combat/arenaSimulation.ts](/C:/Users/danie/Documents/New%20project/frontend/src/game/domain/combat/arenaSimulation.ts)
- [frontend/src/game/domain/maps/mapProgress.test.ts](/C:/Users/danie/Documents/New%20project/frontend/src/game/domain/maps/mapProgress.test.ts)
- [frontend/src/game/domain/spells/spellProgression.test.ts](/C:/Users/danie/Documents/New%20project/frontend/src/game/domain/spells/spellProgression.test.ts)
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
