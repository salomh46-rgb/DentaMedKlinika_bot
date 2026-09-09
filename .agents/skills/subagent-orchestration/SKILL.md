---
name: subagent-orchestration
description: >-
  Decomposes complex plans, features, or directives into parallel subagent workstreams
  and coordinates their execution for maximum speed and quality. Use when a task spans
  multiple independent layers (frontend, backend, tests, docs), when parallel research
  or implementation can save time, or when coordinating a multi-agent swarm.
---

# Subagent Orchestration & Swarm Coordination

## Overview
Subagent Orchestration elevates an agent from an isolated worker into a **Lead Architect and Dispatcher**. It takes large, multi-faceted directives or project plans, decomposes them into modular and non-overlapping subtasks, allocates them to specialized subagents for parallel execution, and synthesizes the deliverables through rigorous quality gates.

---

## 1. Core Principles of Autonomous Teamwork

1. **Isolation of Boundaries (No File Collision)**:
   Never assign two concurrent subagents to edit the same file unless they run in isolated workspaces (`Workspace: 'branch'`). Explicitly declare file ownership for every subagent.
2. **Self-Contained Task Contracts**:
   Subagents do not have access to your internal thinking or full chat history. Every prompt passed to `invoke_subagent` must be 100% self-contained, specifying inputs, constraints, deliverables, and verification commands.
3. **Single-Invocation Concurrency**:
   Always launch independent parallel subagents in a **single** `invoke_subagent` tool call containing multiple entries in the `Subagents` array. Do not launch them sequentially in separate turns.
4. **Reactive Synchronization (No Busy-Polling)**:
   After dispatching subagents, stop calling tools and conclude your turn. Antigravity's messaging system automatically wakes you up as each subagent reports back. Never loop or poll `manage_subagents` status.
5. **Mandatory Quality Gate**:
   Never assume subagents succeeded without proof. Once subagents finish, run build tools, execute test suites, or invoke `code-reviewer` to ensure cohesive system integration.

---

## 2. Workstream Decomposition Framework

When given a plan or command, classify the work into **Independent (Parallel)** vs **Sequential (Dependent)** tasks:

```
                          [User Directive / Plan]
                                     │
                 ┌───────────────────┴───────────────────┐
                 ▼                                       ▼
        [Parallel Workstream 1]                 [Parallel Workstream 2]
     (e.g., Backend API & DB)               (e.g., Frontend UI Components)
                 │                                       │
                 └───────────────────┬───────────────────┘
                                     ▼
                           [Quality Gate / Sync]
                        (Integration Tests & Build)
                                     │
                                     ▼
                         [Sequential Workstream 3]
                       (E2E Tests & Code Review)
```

### Strategy A: Layer Slicing (Full-Stack Swarm)
- **Agent 1 (Backend Specialist)**: Defines schemas, models, and REST/GraphQL endpoints.
- **Agent 2 (Frontend Specialist)**: Builds React/Vue/HTML components and connects mock or live API.
- **Agent 3 (QA / Test Engineer)**: Writes unit tests, mock fixtures, and validation scripts.

### Strategy B: Feature Slicing (Parallel Module Swarm)
When implementing several unrelated features (e.g., User Profile + Payment Gateway + Analytics Tracker):
- Assign each entire feature module to a separate `self` subagent with dedicated file paths.

---

## 3. Subagent Role & Model Selection Matrix

| Subagent Type | Best For | Recommended Model | Tools Equiped |
| :--- | :--- | :--- | :--- |
| **`self`** | Full implementation, creating/editing files, running commands, building features | `inherit` or `pro` | Read, Write, Terminal, MCP |
| **`research`** | Codebase surveying, documentation lookups, dependency audits | `flash` or `inherit` | Read-only tools |
| **`test-engineer`** | Writing test suites (Jest, PyTest, Playwright), coverage analysis | `inherit` | Read, Write, Terminal |
| **`code-reviewer`** | Pre-merge code quality, security audit, architecture sanity | `pro` | Read-only analysis |
| **`security-auditor`** | Vulnerability scanning, secrets leak check, auth hardening | `pro` | Read-only analysis |

---

## 4. The Golden Prompt Template for Subagents

When constructing the `Prompt` string for each subagent in `invoke_subagent`, adhere strictly to this contract:

```markdown
### 🎯 ROLE & OBJECTIVE
You are [Role Name, e.g. Senior Backend Engineer].
Your objective: [Single, unambiguous, focused goal].

### 📂 CONTEXT & RELEVANT FILES
- Primary spec/plan: `path/to/spec.md`
- Reference code: `path/to/existing_model.py`

### 🔒 ASSIGNED SCOPE & FILE BOUNDARIES
You are ONLY allowed to create or modify the following files:
- `backend/models/appointment.py`
- `backend/routes/appointments.py`
DO NOT modify any frontend or config files outside this scope.

### ⚙️ TECHNICAL SPECIFICATIONS & CONSTRAINTS
- Use Pydantic v2 for schema validation.
- All endpoints must return standard JSON: `{ status: "success", data: ... }`.
- Follow PEP 8 and use type hints throughout.

### ✅ ACCEPTANCE CRITERIA
1. [ ] POST `/api/v1/appointments` creates a new record.
2. [ ] GET `/api/v1/appointments/{id}` returns the record or 404.
3. [ ] Invalid payload returns 422 with descriptive error.

### 🧪 VERIFICATION COMMAND
Before finishing, you MUST run this command in terminal to verify your work:
`pytest tests/test_appointments.py`

### 📋 REPORTING FORMAT
Respond with:
1. Summary of changes made.
2. List of created/modified files.
3. Verification results (test outputs, exit codes).
4. Any integration notes for dependent agents.
```

---

## 5. Execution Workflow: Step-by-Step

### Step 1: Analyze and Partition
1. Read the user's prompt or the target `plan.md`.
2. Extract the dependency tree.
3. Define the minimal viable subagent team (usually 2 to 4 subagents; do not oversaturate).
4. Designate strict file ownership per agent.

### Step 2: Parallel Invocation
Invoke all independent agents at once:

```json
{
  "Subagents": [
    {
      "TypeName": "self",
      "Role": "Backend API Engineer",
      "Model": "inherit",
      "Prompt": "### 🎯 ROLE & OBJECTIVE\nImplement the FastAPI appointments CRUD..."
    },
    {
      "TypeName": "self",
      "Role": "Frontend UI Engineer",
      "Model": "inherit",
      "Prompt": "### 🎯 ROLE & OBJECTIVE\nBuild the React appointments list component in src/components/AppointmentsList.tsx..."
    },
    {
      "TypeName": "research",
      "Role": "API Spec Auditor",
      "Model": "flash",
      "Prompt": "### 🎯 ROLE & OBJECTIVE\nVerify OpenAPI contract compatibility with existing clinic data..."
    }
  ]
}
```

### Step 3: Passive Await (Reactive Wakeup)
- Conclude your tool turn immediately.
- Do NOT run loops or status checks.
- When subagents complete, their responses arrive as incoming messages in your context.

### Step 4: Output Synthesis & Conflict Resolution
When messages arrive:
1. Review each subagent's deliverables and verification logs.
2. If any subagent encountered errors or partial failures, send targeted corrective instructions via `send_message(Recipient: conversationId, Message: "...")`.
3. If an agent went completely off track, kill it via `manage_subagents(Action: 'kill', ConversationIds: [...])` and redeploy.

### Step 5: Integration Quality Gate
After all subagents report success:
1. Run the project build command (`npm run build` / `cargo check` / `python -m py_compile`).
2. Run automated integration test suites.
3. If the changes are mission-critical, invoke `code-reviewer` for a 5-point audit.
4. Present a clear, unified walkthrough to the user.

---

## 6. Anti-Patterns to Avoid

| Anti-Pattern | Why It Fails | What to Do Instead |
| :--- | :--- | :--- |
| **Vague delegation** ("Please do task 2") | Subagent lacks context, hallucinates scope | Use the Golden Contract Template with explicit files & criteria |
| **Overlapping file edits** | Git conflicts, overwritten code, lost progress | Enforce disjoint file boundaries or use `Workspace: 'branch'` |
| **Sequential launching** | Loses all speed advantages of parallelism | Launch all independent subagents in a single `invoke_subagent` call |
| **Busy polling** (`manage_subagents` loop) | Consumes tokens and tool turns wastefully | Conclude turn and let Antigravity's reactive wakeup resume you |
| **Blind acceptance** | Broken builds and silent regressions | Run integration verification (`build` / `test`) as the orchestrator |
