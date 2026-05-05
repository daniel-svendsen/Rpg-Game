# AGENTS.md

## Purpose

- Repo-level guidance for AI coding agents in this project.
- Keep this file short and practical. Put deeper setup and workflow details in `README.md`.
- Scope: the full repository unless a deeper `AGENTS.md` overrides it.
- Priority:
  - direct system, developer, and user instructions
  - deeper nested `AGENTS.md`
  - this file

## Project Direction

- Build a simple top-down action RPG inspired by Path of Exile, with smaller scope and simpler visuals.
- Stay web-first and mobile-first.
- Long-term client direction: `TypeScript + React + Phaser 4 + Vite`
- Long-term backend direction: `Spring Boot + Java + PostgreSQL + JWT`
- Long-term Android direction: package the web app through Capacitor

## Core Rules

- Always write code, comments, documentation, UI text, config names, and commit messages in English.
- Prefer reusable systems over one-off logic.
- Prefer centralized configuration over duplicated constants.
- Do not silently introduce new architecture patterns without explaining why.
- Keep solutions simple now, but able to grow later.
- Reuse established naming, architecture, and file patterns before introducing new ones.

## Architecture

- `frontend/src/game/domain` is the source of truth for gameplay rules.
- `frontend/src/game/phaser` is a rendering adapter and scene integration layer only.
- `frontend/src/game/config` owns balance, spells, maps, monsters, and item configuration.
- `frontend/src/app` should stay focused on screen composition, persistence orchestration, and mobile UI flow.
- Keep gameplay rules, progression rules, and balance decisions out of rendering code when practical.
- Keep backend persistence contracts explicit and versionable.
- Prefer early hybrid PostgreSQL persistence:
  - relational ownership data
  - JSONB for flexible game-state sections

## Gameplay Guardrails

- Keep balance values centralized.
- Keep drop rates, map progression, item generation, spell behavior, and progression rules data-driven where practical.
- Keep spell behavior modular and not tightly coupled to rendering.
- Support spells should modify main spells through reusable rules, not custom per-spell hacks.
- Spell progression should use the shared reusable spell progression system.
- Healing rules should stay centralized and readable.
- Gold income, shop pricing, shop item power, and item drop rates should be balanced together.
- Spell UI should show real gameplay information when practical, including:
  - damage
  - cooldown
  - crit chance
  - chain count
  - chain radius
  - area radius
  - upgrade costs

## Current Product Priorities

- `Training Grounds` is rerunnable forever.
- Consumable maps are part of saved progression.
- `Map Shards` are part of the early map-crafting loop.
- Items can be sold for gold.
- The shop should keep evolving as a dedicated mobile-friendly screen.
- Spell/support UX should keep moving toward a simplified FF7 materia-style flow.
- Equipment selection should use slot-first mobile pickers.
- Level-up stat spending should stay in a dedicated character/stats view.

## Persistence And Save Rules

- Treat saved progression as a first-class system.
- Spell progression is saved progression.
- Life flask state is saved progression.
- Do not let the save contract become a dumping ground for arbitrary nested JSON without review.
- Prefer dedicated backend request DTOs for save and update operations.
- If new saved fields are added on the frontend, update backend DTOs, entity mapping, and migrations when needed.
- When save shape changes, consider migration or normalization for existing saves.
- Be careful with legacy spell ids, support ids, map ids, and saved item shapes.

## Cost And Network Guardrails

- Prefer low-chatter client/server designs.
- Avoid frequent polling when event-driven or batched updates are sufficient.
- Batch writes where practical, especially for progression, inventory, and analytics.
- Do not send full game-state payloads when partial updates are enough.
- Optimize for mobile bandwidth, battery usage, and backend cost from the start.
- Do not sacrifice correctness, save safety, or user experience just to reduce request count.
- When changing backend or persistence behavior, consider:
  - request volume
  - database writes
  - payload size
  - idle infrastructure cost

## Change Checklist

- When a change touches one system, check whether it also affects:
  - frontend
  - backend
  - persistence
  - balance
  - mobile UX
  - saved progression
- If a change affects spells, drops, equipment, inventory, maps, progression, or persistence, assume extra verification is needed.

## Agent Efficiency

- Prefer repo context and existing project instructions over broad exploratory research.
- Keep answers concise when the user wants direction rather than a full implementation plan.
- Batch related analysis and edits into one pass when practical instead of many small iterations.
- Use web research only when the information is time-sensitive, the user asks for it, or source verification materially helps.
- When research is needed, prefer a small number of high-signal official sources.
- If a workflow becomes repetitive, prefer a shared repo instruction or reusable command/skill over re-explaining it each time.

## Local Workflow

- Standard repo-root commands:
  - `.\start-dev.ps1`
  - `.\clean-start-dev.ps1`
  - `.\stop-dev.ps1`
- Do not reintroduce legacy split startup scripts.
- If local workflow changes, keep `README.md`, `.gitignore`, and this file aligned.

## Git And Secrets

- Before staging, committing, or pushing, check that sensitive and local-only files are excluded.
- Never push secrets, passwords, local tokens, local database credentials, or private environment values.
- Treat these as non-pushable unless the user explicitly says otherwise:
  - `dev.local.properties`
  - local `.env` files
  - `.run/`
  - `.m2/`
  - generated local build artifacts

## Verification

- After making changes, run relevant checks when practical and make a best effort to verify they pass.
- Common checks for this repo:
  - frontend build
  - frontend domain and app guardrail tests
  - backend tests
  - backend startup or migration awareness
  - save/load and autosave awareness when persistence changes

## Manual Vs Codex

- Can be generated by Codex:
  - source files
  - config files
  - DTOs
  - UI layouts
  - domain logic
  - save normalization logic
  - README and agent documentation
- Manual step for the user:
  - installing dependencies if required locally
  - creating PostgreSQL databases
  - changing local secrets and environment values
  - packaging and publishing to Google Play
