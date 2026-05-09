# AGENTS.md

## Purpose

- Backend-specific instructions for `backend/`.
- Inherit repo-wide rules from the root `AGENTS.md`.
- Read `ROADMAP.md` before proposing major backend work.
- Read `docs/PROJECT_VISION.md` when product direction or gameplay progression intent matters.

## Backend Priorities

- The backend must reach a clear acceptance state for the current prototype scope.
- Preferred backend stack: `Java + Spring Boot + PostgreSQL + JWT`.
- Favor robustness, save safety, and predictable contracts over speculative architecture upgrades.
- Treat the current backend as supporting a focused game prototype, not as an infinite platform exercise.
- Do not introduce major backend stack drift unless there is a clear product or maintainability reason.

## Current Phase Awareness

- During `Phase 1 - Backend Acceptance`, prioritize only work that improves:
  - auth reliability
  - save/load correctness
  - DTO clarity
  - persistence mapping
  - migration safety
  - meaningful backend test coverage
- If the roadmap acceptance checklist appears satisfied, call that out explicitly instead of continuing endless generic hardening.

## Persistence Guardrails

- Keep persistence contracts explicit and versionable.
- Prefer dedicated request DTOs over loosely structured payloads.
- Do not turn JSONB-backed save sections into an unreviewed dumping ground.
- If frontend save shape changes, verify whether backend DTOs, mapping, and migrations must change too.
- Be careful with saved ids, item shapes, map ownership, spell progression, support links, currencies, and life flask state.
- Treat saved progression as a first-class system.
- Spell progression is saved progression.
- Life flask state is saved progression.
- When save shape changes, think through migration or normalization impact for existing saves.

## API And Error Handling

- Prefer predictable API responses and clear validation failures.
- Avoid silent fallback behavior that can hide persistence bugs.
- Keep controller and service responsibilities clear.
- If adding fields to save-related requests, keep naming explicit and consistent with frontend types.
- Prefer backend/API errors that help the frontend show specific user-facing feedback instead of generic failures.

## Acceptance Mindset

Backend acceptance for the current phase means the following areas feel stable and verified:

- register/login/JWT flow
- character creation
- character load and save
- progression persistence
- migration startup from a fresh database
- important backend tests for stat calculation and persistence behavior

Do not keep expanding the definition of "done" without a concrete product reason.

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

## Security Filter Guardrails

- Do not annotate `OncePerRequestFilter` implementations with `@Component` when they are also registered manually inside a `SecurityFilterChain`. Spring Boot auto-registers `@Component` beans as global servlet filters, which runs them for every request — including endpoints they are not supposed to reach (such as `/api/auth/**`).
- Always instantiate security filters manually inside the relevant `SecurityFilterChain` bean and leave `@Component` off the filter class.
- JWT filters must catch `JwtException` (covers `ExpiredJwtException`, `MalformedJwtException`, `SignatureException`, etc.) and skip authentication silently. Uncaught JWT exceptions propagate as 500 errors and prevent otherwise-permitted endpoints from working.
- After changing filter registration or exception handling, verify with tests that auth endpoints still accept requests without a token and that expired tokens on protected endpoints return 401/403, not 500.

## Dependency And Pattern Guidance

- Question current backend approaches when a dependency or established pattern would clearly improve safety, clarity, or maintenance cost.
- Prefer Spring Boot conventions, Java standard library tools, and existing repo patterns before adding new libraries.
- Do not add persistence, mapping, validation, or infrastructure dependencies casually.
- If suggesting or adding a backend dependency, explain:
  - the concrete problem it solves
  - why the current approach is weaker
  - the tradeoff in complexity, abstraction, or maintenance

## Verification

- Run relevant backend tests when practical.
- After adding a backend feature, add or update relevant automated tests when practical.
- After fixing a backend bug, prefer adding a regression test when practical.
- If tests are not updated where they would normally be expected, explain why.
- If persistence logic changes, think through:
  - DTO updates
  - entity mapping updates
  - migration impact
  - compatibility with existing saves
- If a persistence change affects gameplay progression, mention the risk explicitly.
- If auth or validation behavior changes, consider whether the frontend can now surface clearer login/register/save error feedback.
