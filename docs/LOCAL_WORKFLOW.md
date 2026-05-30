# Local Workflow Notes

This file keeps local setup, Git hygiene, and future packaging notes out of the portfolio-focused `README.md`.

## Local Setup

1. Copy `dev.local.properties.example` to `dev.local.properties`.
2. Set your real PostgreSQL password in `dev.local.properties`.
3. Optional for custom frontend API targeting: copy `frontend/.env.example` to `frontend/.env` and set `VITE_API_BASE_URL`.
4. Make sure PostgreSQL is available locally.
5. Create the PostgreSQL database if it does not already exist.

The default local database name used by the quick-start flow is:

```text
simple_arpg
```

## Local Test Flow

This project is set up so another developer can test it locally with a small number of steps.

1. Clone the repository.
2. Create a local PostgreSQL database named `simple_arpg`.
3. Copy `dev.local.properties.example` to `dev.local.properties`.
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

7. Register a new account and create a character.
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

For what each command does and when to use it, see [COMMANDS.md](COMMANDS.md).

## Git And Secrets

Do not commit local secrets.

Ignored local-only files include:

- `dev.local.properties`
- `frontend/.env`
- `backend/.env`
- `.run/`
- `.m2/`

Recommended Git flow:

1. Review local config files and make sure secrets only exist in ignored files.
2. Stage project files.
3. Commit.
4. Add a remote if the repository is not already connected.
5. Push.

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

Backend automated tests:

```powershell
cd backend
mvn test
```

Fresh database startup verification:

```powershell
.\verify-fresh-backend-db.ps1
```

That script creates a temporary PostgreSQL database from your local `dev.local.properties`, starts the backend against that empty database, verifies that Flyway migrations were applied, and then drops the temporary database again.

For the full simulation workflow and report interpretation, see [SIMULATION.md](SIMULATION.md).

## Persistence Checklist

Character saves currently include:

- stats
- level and experience
- gold
- inventory and equipped items
- unlocked spells
- unlocked supports
- spell progression levels
- support progression levels
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

## Future Android Packaging

The project already has some groundwork for future packaging:

- mobile-safe layout spacing
- web manifest
- starter Capacitor config
- backend CORS defaults for common Capacitor origins

Install Capacitor when ready:

```powershell
cd frontend
npm install -D @capacitor/cli
npm install @capacitor/core @capacitor/android
```

Initialize Android once:

```powershell
npx cap add android
```

Build and sync the web app into the Android shell:

```powershell
npm run build:mobile
npx cap sync android
```

Open Android Studio:

```powershell
npx cap open android
```
