# AGENTS.md (backend)

## Scope
- Applies to `backend/`.
- Inherits root rules from `/AGENTS.md`.

## Stack And Structure
- Java 17 + Spring Boot 3 + PostgreSQL + Flyway + JWT.
- Keep clear boundaries.
- `auth/`: authentication flow.
- `character/`: character APIs, save DTOs, mapping, progression persistence.
- `security/` and `config/`: security chain, JWT config, app config.
- `resources/db/migration/`: Flyway migrations.

## Backend Rules
- Keep controllers thin, services explicit, DTOs versionable.
- Validate input on the backend; do not trust client payloads.
- Keep authorization checks server-side.
- Prefer explicit error responses over silent fallback behavior.
- Treat saved progression as a first-class contract.
- Do not register security filters twice (for example both `@Component` and `SecurityFilterChain`).
- JWT parsing failures must not crash requests with 500; handle token exceptions safely.

## High-Risk Changes
- Ask before changing DB schema/migrations, auth flow, or public API contracts.
- For save-shape changes, review DTOs, entity mapping, migrations, and compatibility.
- Do not disable security, validation, or tests to make a task pass.

## Verification
- Run relevant checks after changes.
- `cd backend && mvn test`
- Optional integration profile: `cd backend && mvn verify -Pdb-integration-tests`
- If persistence behavior changes, run `.\verify-fresh-backend-db.ps1` when practical.
- For behavior changes, add or update tests that lock expected behavior when practical.
- If API/persistence behavior changed and is documented in existing files, update those files in the same task.
- If expected tests or doc updates are skipped, explain why in the final response.
