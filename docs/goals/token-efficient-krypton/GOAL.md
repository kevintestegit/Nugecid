# Goal: Token-Efficient Krypton Work

Use Krypton Execution to execute `docs/goals/token-efficient-krypton/PLAN.md`.

Core rules:
- Treat `PLAN.md` as the source plan.
- Preserve intent, ownership, contract boundary, cutover, evidence, and kill criteria.
- Read only the smallest current-state slice needed for the active request.
- Use memory as a locator, not proof; verify stale or risky facts.
- Avoid broad repo rediscovery unless the bounded evidence contradicts assumptions.
- For multi-step work, keep a compact plan and update it instead of narrating everything.
- Verify with the smallest commands that prove the real path.
- Final answer includes only changed files, verification, blockers, and material risks.
- Say `implemented but unproven` if target-perspective evidence cannot be captured.
