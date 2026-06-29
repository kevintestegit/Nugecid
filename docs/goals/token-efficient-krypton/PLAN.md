# Token-Efficient Krypton Work Implementation Plan

**Intent:** Reduce token waste in future SGC-ITEP work by using a compact Krypton workflow that limits rediscovery and keeps evidence focused.
**Current Behavior:** Each task can trigger broad repo exploration, repeated context gathering, long status reports, and verification that is wider than the changed slice.
**Expected Outcome:** Future turns use a narrow map, a compact source plan for multi-step work, and short evidence-driven reporting.
**Target-Perspective Output:** The user sees faster task execution with fewer repeated explanations and final answers limited to changed files, verification, blockers, and risks.
**Truth Owner:** Current repository state plus the active user request. Memory and summaries are hints, not proof.
**Contract Boundary:** Planning and reporting discipline only; no business logic, API contract, database schema, or runtime behavior changes.
**Cutover:** Use this goal package as the default handoff for token-efficient execution.
**Displaced Path:** Broad exploratory scans and long narrative summaries when a bounded slice is enough.
**Value Density:** High; this reduces recurring overhead across unrelated tasks.
**Acceptance Evidence:** `GOAL.md` exists, points here, and can be pasted as a compact `/goal`; this `PLAN.md` names ownership, boundary, cutover, evidence, and kill criteria.
**Evidence Lane:** File inspection of `docs/goals/token-efficient-krypton/PLAN.md` and `docs/goals/token-efficient-krypton/GOAL.md`.
**Kill Criteria:** If a task is simple, answer or act directly. If a task is multi-step, use this plan to limit context reads and verification scope.
**Architecture Slice:** Documentation-only goal package under `docs/goals/token-efficient-krypton/`.
**Plan Review Gate:** Self-review before use; no code execution required.

## Tasks

### Task 1: Establish Compact Goal Package

**Files allowed:**
- `docs/goals/token-efficient-krypton/PLAN.md`
- `docs/goals/token-efficient-krypton/GOAL.md`

**Files forbidden:**
- Application source files
- Backend contracts
- Frontend behavior files
- Runtime configuration

**Output:**
- A compact plan and a short handoff prompt.

**Verification:**
- Inspect both files and confirm they define intent, ownership, boundary, cutover, evidence, and kill criteria.

**Acceptance evidence:**
- `GOAL.md` can be used without repeating the full plan.

**Parallel safe:** No.

## Operating Rules

- Start each non-trivial task by identifying the smallest relevant slice.
- Use memory only to find likely paths or prior decisions; verify drift-prone facts in the current state.
- Prefer `rg` and focused file reads over broad scans.
- For implementation, test the changed behavior first when practical.
- Report only what changed, what proved it, and what remains risky or blocked.
- Do not mark a goal complete without checking every explicit requirement against current evidence.
