# Command Reference

## Purpose

This document collects the main local workflow, demo, build, and verification commands in one place.

## Standard Local Dev

Start or restart frontend + backend:

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

Use the frontend locally against the live demo backend:

```powershell
.\start-dev-against-demo.ps1
```

## Demo / Sharing

Start the normal demo flow:

```powershell
.\start-demo.ps1
```

Rebuild backend first, then start demo:

```powershell
.\start-demo.ps1 -BuildBackend
```

Use a temporary quick tunnel:

```powershell
.\start-demo.ps1 -TunnelMode quick
```

Stop the demo tunnel:

```powershell
.\stop-demo.ps1
```

Stop the tunnel but keep backend containers running:

```powershell
.\stop-demo.ps1 -KeepBackend
```

## Frontend Build

Standard production build:

```powershell
cd frontend
npm run build
```

GitHub Pages-style build:

```powershell
cd frontend
$env:VITE_API_BASE_URL="https://your-backend-url.trycloudflare.com"
$env:VITE_BASE_PATH="/your-repo-name/"
npm run build:pages
```

## Tests And Verification

Frontend tests:

```powershell
cd frontend
npm test
```

Backend tests:

```powershell
cd backend
mvn test
```

Fresh database verification:

```powershell
.\verify-fresh-backend-db.ps1
```

## Simulation

Quick simulation run:

```powershell
cd frontend
npm run sim -- --profile starter-caster --map trainingGrounds --runs 100
```

Simulation with backend character:

```powershell
cd frontend
npm run sim -- --email you@example.com --password your-password --map tier3Map --runs 100
```

For the full simulator workflow and report interpretation, use:

- [Simulation Guide](SIMULATION.md)

## Command Placement Rule

Keep command content in these places:

- `README.md`: only the most important quick-start commands
- `docs/COMMANDS.md`: the main command reference
- `docs/SIMULATION.md`: simulator-specific command usage and interpretation
- `DEPLOYMENT.md`: deploy and public demo flows
