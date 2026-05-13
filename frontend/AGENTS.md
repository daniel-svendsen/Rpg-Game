# AGENTS.md (frontend)

## Scope
- Applies to `frontend/`.
- Inherits root rules from `/AGENTS.md`.

## Stack And Structure
- React 19 + TypeScript + Vite + Phaser 4.
- `src/app`: screen composition, UX flow, persistence orchestration.
- `src/game/domain`: gameplay source of truth.
- `src/game/config`: centralized balance/content config.
- `src/game/phaser`: rendering adapter only.
- `src/api`: HTTP/API client layer.

## Frontend Rules
- Keep gameplay rules out of React components and Phaser scenes.
- Reuse existing components/hooks/utils/types before creating new ones.
- Prefer small extraction over growing monolithic files.
- Keep UI mobile-first and readable.
- Keep changes aligned with current roadmap phase in `/ROADMAP.md`.
- Keep spell and monster visuals data-driven via config/mappings, not hardcoded scene logic.
- Update `src/game/phaser/spriteConfig.ts` when adding monster visual assignments.
- For new spell visual categories, prefer extending shared config/tag flow before touching scene-specific branching.

## Data And API Guardrails
- Keep request/response types explicit.
- Avoid ad hoc fetch logic when existing API helpers can be reused.
- If save/progression payload shape changes, flag backend DTO/mapping/migration impact.

## Verification
- Run at least one relevant check after changes.
- `cd frontend && npm test`
- `cd frontend && npm run build`
- For behavior changes, add or update tests that lock expected behavior when practical.
- If UI or gameplay behavior changed and is documented in existing files, update those files in the same task.
- If expected tests or doc updates are skipped, explain why in the final response.
