# Commit Guidelines

## Rules
- Do not add `Co-authored-by` or AI attribution lines unless explicitly requested.
- Keep messages specific enough to understand history without opening the diff.

## Non-Trivial Commit Format
1. First line: short imperative summary.
2. Blank line.
3. Then 2-5 bullets covering:
- what changed
- why
- risk/impact
- tests/checks run

## Example
```text
Improve auth error feedback flow

- Map backend auth error codes to explicit UI messages.
- Reduce generic failures so users can self-correct input faster.
- Low risk: presentation-layer changes only.
- Checks: npm test, npm run build, mvn test.
```
