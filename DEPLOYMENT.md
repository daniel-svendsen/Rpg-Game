# Deployment And Demo Guide

This file collects the exact steps for sharing the project outside your own machine.

## Choose A Path

- Use `Cloudflare Pages + Quick Tunnel` for the fastest free setup.
- Use `Cloudflare Pages + named Cloudflare Tunnel` for a stable backend URL.

The frontend lives on Cloudflare Pages.
The backend runs locally on your computer through Docker.

## Prerequisites

1. Docker Desktop is installed and running
2. `cloudflared` is installed on Windows
3. The repo root `.env` exists
4. Cloudflare Pages is connected to this GitHub repository

Create `.env` once from the repo root:

```powershell
Copy-Item compose.env.example .env
```

Set at least:

```env
POSTGRES_PASSWORD=replace-with-a-local-demo-password
APP_JWT_SECRET=replace-this-with-a-secret-at-least-32-characters-long
APP_JWT_EXPIRATION_SECONDS=86400
APP_REQUEST_SIZE_AUTH_JSON_MAX=16KB
APP_REQUEST_SIZE_API_JSON_MAX=1MB
APP_SECURITY_PRODUCTION_MODE=true
APP_CLIENT_ALLOWED_ORIGIN_PATTERNS=https://shardborne.pages.dev
APP_AUTH_LOGIN_RATE_LIMIT_ENABLED=true
APP_AUTH_LOGIN_RATE_LIMIT_MAX_ATTEMPTS_PER_IP=8
APP_AUTH_LOGIN_RATE_LIMIT_MAX_ATTEMPTS_PER_EMAIL=5
APP_AUTH_LOGIN_RATE_LIMIT_WINDOW=1m
```

## Cloudflare Pages Setup

Create a Pages project with:

- Project root: `frontend`
- Build command: `npm run build`
- Output directory: `dist`
- `VITE_BASE_PATH=/`

The frontend URL for this project is currently:

- [https://shardborne.pages.dev/](https://shardborne.pages.dev/)

## Quick Tunnel Flow

Use this when you want the fastest possible free demo.

### One-time Pages variable

Add this variable in Cloudflare Pages:

- `VITE_API_BASE_URL=https://your-current-quick-tunnel.trycloudflare.com`

### Every time you want the demo online

Run from the repo root:

```powershell
.\start-demo.ps1 -TunnelMode quick
```

If backend code changed and Docker should rebuild first:

```powershell
.\start-demo.ps1 -TunnelMode quick -BuildBackend
```

The script:

- starts Docker Compose
- starts a Cloudflare Quick Tunnel
- prints the public `trycloudflare.com` URL

After the script prints the URL:

1. Copy the new `https://...trycloudflare.com` URL
2. Update `VITE_API_BASE_URL` in Cloudflare Pages
3. Trigger a new Cloudflare Pages deploy
4. Open the frontend site and test

To stop the quick tunnel:

```powershell
.\stop-demo.ps1
```

To stop the tunnel but leave Docker running:

```powershell
.\stop-demo.ps1 -KeepBackend
```

### Quick Tunnel downside

The URL changes after restart, so Cloudflare Pages must be updated and redeployed when that happens.

## Named Tunnel Flow

Use this when you want a stable backend URL.

This project uses:

- backend hostname: `rpg-api.svendsenphotography.com`

### One-time setup

1. Log in `cloudflared`:

```powershell
& "C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel login
```

2. Create a named tunnel:

```powershell
& "C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel create rpg-game-backend
```

3. Route DNS to the tunnel:

```powershell
& "C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel route dns rpg-game-backend rpg-api.svendsenphotography.com
```

4. Create the local config file:

Path:

```text
C:\Users\danie\.cloudflared\config.yml
```

Template:

```yaml
tunnel: YOUR-TUNNEL-ID
credentials-file: C:\Users\danie\.cloudflared\YOUR-TUNNEL-ID.json

ingress:
  - hostname: rpg-api.svendsenphotography.com
    service: http://localhost:8080
  - service: http_status:404
```

This repo also includes a template at:

- [cloudflared/config.named-tunnel.example.yml](cloudflared/config.named-tunnel.example.yml)

5. Update Cloudflare Pages one last time:

- `VITE_API_BASE_URL=https://rpg-api.svendsenphotography.com`

6. Trigger a new Cloudflare Pages deploy

After that, the frontend can keep the same backend URL between restarts.

## Dev Vs Public Demo Mode

`start-demo.ps1` can start the same Docker + tunnel flow in two modes:

- `LocalDev` is the default. It sets `APP_SECURITY_PRODUCTION_MODE=false` and allows localhost/dev CORS origins. Use it when testing with `npm run dev`, local devices, or private iteration.
- `PublicDemo` sets `APP_SECURITY_PRODUCTION_MODE=true` and locks CORS to `https://shardborne.pages.dev`. Use it before sharing the public frontend link in Discord, Reddit, or similar communities.

Public demo session:

```powershell
.\start-demo.ps1 -Mode PublicDemo -BuildBackend
```

Local/dev session:

```powershell
.\start-demo.ps1 -Mode LocalDev
```

The mode only overrides safety/CORS values for the current script run. Keep real secrets such as `POSTGRES_PASSWORD` and `APP_JWT_SECRET` in the local `.env` file.

### Every time you want the demo online

Run from the repo root:

```powershell
.\start-demo.ps1
```

If backend code changed and Docker should rebuild first:

```powershell
.\start-demo.ps1 -BuildBackend
```

This starts Docker Compose in `LocalDev` mode and then runs the named tunnel `rpg-game-backend`. For a public test window, prefer:

```powershell
.\start-demo.ps1 -Mode PublicDemo -BuildBackend
```

Then open the frontend:

- [https://shardborne.pages.dev/](https://shardborne.pages.dev/)

### Important note

Do not browse the backend hostname expecting a normal web page.

- `https://rpg-api.svendsenphotography.com/` may return `403`

That is okay.
The frontend uses `/api/...` requests in the background.

## Register And Login

- Registration requires a valid email address
- Passwords must be between `8` and `100` characters
- Registration and failed login attempts are rate limited per client IP and normalized email; repeated failed login attempts return a `429` API error.
- Oversized JSON API bodies are rejected with a `413` API error before request parsing. Auth payloads default to `16KB`; other API payloads, including character saves, default to `1MB`.
- Auth abuse signals are logged as structured `auth_event=...` lines for failed logins, rate-limit hits, and duplicate registrations. Logs use hashes for client and email values; passwords and tokens are never logged.
- During a public test window, watch Docker/backend logs for `auth_event=...` and spikes in `401`, `403`, `409`, `429`, or `5xx`.
- If the Docker database is fresh, register a new account before logging in

## Production Safety Switch

Use `.\start-demo.ps1 -Mode PublicDemo -BuildBackend` before exposing the backend publicly. In that mode the script sets `APP_SECURITY_PRODUCTION_MODE=true`, and startup fails unless:

- `APP_JWT_SECRET` is a non-default secret with at least `32` characters
- `APP_CLIENT_ALLOWED_ORIGIN_PATTERNS` contains exact deployed HTTPS frontend origins, for example `https://shardborne.pages.dev`
- wildcard, localhost, private-network, Capacitor, and Ionic origins have been removed from backend CORS

## Security Headers

Security headers are split by response owner:

- Backend API responses are owned by Spring Boot security configuration. They include HSTS, `X-Content-Type-Options`, frame denial, and an API-safe CSP that blocks browser loading contexts by default.
- Frontend static responses are owned by Cloudflare Pages through [frontend/public/_headers](frontend/public/_headers). The frontend CSP allows app assets from `self`, image blobs generated while Phaser processes spritesheets, and API calls to `https://rpg-api.svendsenphotography.com`.

If the public backend hostname changes, update both Cloudflare Pages `VITE_API_BASE_URL` and the `connect-src` entry in `frontend/public/_headers`.

## What To Restart After Changes

- Frontend-only changes:
  - push to GitHub
  - let Cloudflare Pages redeploy

- Backend-only changes:
  - restart Docker backend
  - no frontend redeploy needed unless API URL changed

- Tunnel-only restart:
  - Quick Tunnel: update `VITE_API_BASE_URL` and redeploy frontend
  - named tunnel: no frontend variable change needed

- Save schema or persistence changes:
  - rebuild/restart backend
  - consider whether the Docker Postgres volume should be kept or reset

## Local Files That Should Stay Local

Do not commit:

- `.env`
- `dev.local.properties`
- `C:\Users\danie\.cloudflared\config.yml`
- `C:\Users\danie\.cloudflared\cert.pem`
- `C:\Users\danie\.cloudflared\*.json`
