# Claude Code & Google Antigravity SDK — Integration Best Practices

> **Research Date:** May 24, 2026  
> **Scope:** Setup, configuration patterns, tool integration, multi-agent orchestration, and security best practices for both platforms.

---

## Table of Contents

1. [Claude Code Best Practices](#1-claude-code-best-practices)
   - [1.1 CLAUDE.md Configuration](#11-claudemd-configuration)
   - [1.2 Hooks System](#12-hooks-system)
   - [1.3 Plan Mode & Workflow Safety](#13-plan-mode--workflow-safety)
   - [1.4 MCP Server Integration](#14-mcp-server-integration)
   - [1.5 Multi-Agent Orchestration](#15-multi-agent-orchestration)
   - [1.6 Safety & Permissions](#16-safety--permissions)
   - [1.7 Context Management](#17-context-management)
2. [Google Antigravity SDK](#2-google-antigravity-sdk)
   - [2.1 Setup & Installation](#21-setup--installation)
   - [2.2 Agent Configuration](#22-agent-configuration)
   - [2.3 MCP Integration](#23-mcp-integration)
   - [2.4 Lifecycle Hooks](#24-lifecycle-hooks)
   - [2.5 Structured Output](#25-structured-output)
   - [2.6 Custom Tools](#26-custom-tools)
   - [2.7 Subagents & Orchestration](#27-subagents--orchestration)
   - [2.8 Security & Sandboxing](#28-security--sandboxing)
3. [Cross-Platform Comparison](#3-cross-platform-comparison)
4. [Anti-Patterns to Avoid](#4-anti-patterns-to-avoid)

---

## 1. Claude Code Best Practices

### 1.1 CLAUDE.md Configuration

`CLAUDE.md` is the single highest-leverage tool in a Claude Code workflow. Treat it as an onboarding document for a junior developer — not an exhaustive wiki.

#### File Hierarchy

| Scope | Path | Purpose |
|:------|:-----|:--------|
| **Global (User)** | `~/.claude/CLAUDE.md` | Personal preferences: indentation, tone, persona |
| **Project** | `./CLAUDE.md` or `./.claude/CLAUDE.md` | Shared team standards, architecture, build/test commands |
| **Modular Rules** | `.claude/rules/*.md` | Topic-specific, path-scoped instructions |

#### Content Guidelines

**What to include:**
1. **Project overview** — one-liner describing what the project does
2. **Tech stack** — key frameworks, libraries, and versions
3. **Coding conventions** — naming patterns, typing standards, file placement
4. **Verification commands** — `build`, `test`, `lint`, `typecheck` commands
5. **Prohibitions** — explicit "never do X" rules (e.g., "Do not use `any` in TypeScript")

**Design principles:**
- **Keep it lean** — under 200–250 lines; adherence drops in long files
- **Use falsifiable rules** — "All async functions must include a timeout" > "write good code"
- **Progressive disclosure** — core rules inline, reference external docs via `@import`
- **Iterative maintenance** — if Claude makes the same mistake twice, add a specific rule
- **No style guide bloat** — enforce formatting via hooks + linters, not instructions

#### Example Structure

```markdown
# CLAUDE.md

## Project
Multi-tenant SaaS platform — Next.js 15 / TypeScript / PostgreSQL

## Stack
- Runtime: Node.js 22 LTS
- Framework: Next.js 15 App Router
- ORM: Drizzle 0.30+
- Auth: Better-Auth 1.x

## Commands
- Build: `npm run build`
- Test: `npm test`
- Lint: `npm run lint`
- Typecheck: `npx tsc --noEmit`

## Rules
- Use ES modules, never CommonJS
- All async functions must include a timeout
- Never use `any` — use `unknown` + type guards
- All API routes must validate input with Zod
```

---

### 1.2 Hooks System

Hooks are **deterministic**, system-level interceptors that execute shell commands at specific lifecycle events. Unlike `CLAUDE.md` instructions (which the model may occasionally overlook), hooks run **every time**.

#### Hook Types

| Hook | Fires | Use Case |
|:-----|:------|:---------|
| **PreToolUse** | Before a tool executes | Block dangerous ops, protect sensitive files |
| **PostToolUse** | After a tool completes | Auto-format, run tests, log activity |
| **Notification** | When Claude needs input | Desktop alerts for async workflows |

#### Configuration Location

Hooks are defined in JSON settings files:
- `~/.claude/settings.json` — global
- `.claude/settings.json` — project-shared
- `.claude/settings.local.json` — personal (gitignored)

Or use the interactive `/hooks` command in the CLI.

#### Examples

**Auto-format code after writes:**

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "npx prettier --write \"$CLAUDE_TOOL_INPUT_FILE_PATH\""
          }
        ]
      }
    ]
  }
}
```

**Block edits to sensitive files:**

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "if [[ \"$CLAUDE_TOOL_INPUT_FILE_PATH\" == *\"/.env\"* ]]; then exit 2; fi"
          }
        ]
      }
    ]
  }
}
```

> **Critical:** Exit code `2` = block the action entirely. All other exit codes allow the action to proceed.

**Custom security pre-check:**

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "echo $CLAUDE_TOOL_INPUT | jq -r '.command' | grep -qE 'curl.*\\|.*sh' && exit 2 || exit 0"
          }
        ]
      }
    ]
  }
}
```

#### Hook Best Practices
- **Always test hooks in a safe directory first** — they run with your user permissions, no sandbox
- **Use `jq` to parse stdin** — Claude pipes a JSON payload with tool name and input details
- **Combine hooks with linters** — PostToolUse + ESLint/Prettier = deterministic formatting

---

### 1.3 Plan Mode & Workflow Safety

Plan mode forces Claude to outline its approach **before** taking action. Essential for any task touching more than 2–3 files.

#### Permission Modes

| Mode | Behavior | Best For |
|:-----|:---------|:---------|
| **Default** | Prompts for first use of any tool | Day-to-day development |
| **acceptEdits** | Auto-approves file changes, prompts for Bash | Trusted edit sessions |
| **plan** | Read-only — analyze and plan, no execution | Architecture review, code audit |
| **dontAsk** | Auto-denies all unless pre-approved | CI/CD, locked-down environments |
| **auto** | Model-based classifier approves safe actions | Balanced autonomy |
| **bypassPermissions** | Skips all prompts | ⚠️ Docker/VM only |

> Toggle modes with `Shift+Tab` in the CLI or set in `settings.json`.

#### Recommended Workflow

```
Plan → Review → Execute → Verify
```

1. **Plan**: Ask Claude to outline the approach
2. **Review**: Read the plan, provide feedback on gaps
3. **Execute**: Switch to execution mode
4. **Verify**: Run tests, confirm output

---

### 1.4 MCP Server Integration

#### Configuration Methods

**CLI (Recommended):**

```bash
# stdio transport
claude mcp add --transport stdio my-server -- npx -y @mcp/my-server

# HTTP transport
claude mcp add --transport http my-server --url https://api.example.com/mcp

# Verify
claude mcp list
```

**Manual `.mcp.json` (project root):**

```json
{
  "mcpServers": {
    "my-server": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-example"],
      "env": {
        "API_KEY": "your_key_here"
      }
    }
  }
}
```

**Windows-specific wrapper:**

```json
{
  "mcpServers": {
    "my-server": {
      "command": "cmd",
      "args": ["/c", "npx", "-y", "@mcp/my-server"]
    }
  }
}
```

#### Managed MCP (Enterprise)

Admins enforce non-overridable MCP configs via:
- **Linux/WSL:** `/etc/claude-code/managed-mcp.json`
- **macOS:** `/Library/Application Support/Claude/managed-mcp.json`
- **Windows:** `%ProgramData%\Claude\managed-mcp.json`

#### Troubleshooting
- `/mcp` — list active servers
- `/doctor` — diagnose connectivity
- Restart session after config changes
- Use `claude mcp set-env <server> KEY=value` for secrets

---

### 1.5 Multi-Agent Orchestration

#### Architecture Patterns

| Pattern | Best For | Characteristics |
|:--------|:---------|:----------------|
| **Sequential Pipeline** | Linear tasks (Plan → Execute → Verify) | Rigid, predictable; step-by-step |
| **Operator (Orchestrator-Worker)** | Complex decomposition | Manager breaks down work, delegates to specialists |
| **Parallel Fan-out** | Independent exploration tasks | Simultaneous subagents, aggregated results |
| **Agent Teams** | Cross-cutting, interdependent changes | Direct peer communication (experimental 2026) |

#### Subagent Usage (Task Tool)

Subagents are spawned via the **Task tool** and operate in isolated context windows:

- ✅ Use for noisy tasks: file search, test execution, codebase exploration
- ✅ Use for parallel work: multiple independent implementation tasks
- ✅ Use for specialization: different agents for UX, architecture, testing
- ❌ Don't use when a single session suffices — adds ~15x token overhead

#### Tiered Model Routing (Cost Optimization)

| Role | Recommended Model Tier |
|:-----|:----------------------|
| **Orchestrator** | High-reasoning (Opus) |
| **Implementation Worker** | Mid-tier (Sonnet) |
| **Explorer / File Discovery** | Low-cost (Haiku) |

#### Best Practices
- **Context isolation** — keep the lead session clean; delegate noisy tasks
- **Human-in-the-loop gates** — Explore → Plan → [Human Review] → Execute
- **Codify in CLAUDE.md** — standardize agent behavior as `.claude/agents/` configs
- **Start simple** — adopt multi-agent only when single-session context is insufficient

---

### 1.6 Safety & Permissions

#### Declarative Permission Rules

```json
{
  "permissions": {
    "deny": ["Bash(rm -rf:*)", "Bash(curl:*)", "Bash(wget:*)"],
    "allow": ["Read", "Grep", "Glob"],
    "disableBypassPermissionsMode": "disable"
  }
}
```

#### Safety Checklist

| Practice | Implementation |
|:---------|:---------------|
| **Never run as root** | Use standard user accounts |
| **OS-level sandboxing** | Docker/VM isolation for untrusted tasks |
| **Scope MCP servers** | Allow only trusted servers |
| **Protect secrets** | Never put API keys in CLAUDE.md or chat |
| **Write restrictions** | Default: project directory only |
| **PreToolUse hooks** | Custom blocking for dangerous patterns |
| **Disable bypass** | `disableBypassPermissionsMode: "disable"` for teams |
| **Audit regularly** | Review settings.json for overly broad permissions |

---

### 1.7 Context Management

| Strategy | How |
|:---------|:----|
| **Compact regularly** | Use `/compact` after major milestones |
| **Document & clear** | Summarize progress to markdown, then `/clear` |
| **Delegate to subagents** | Isolate deep exploration in separate contexts |
| **Selective references** | Use `@file` to point to specific relevant files |
| **Monitor usage** | Watch token usage in status bar; use `/context` |

---

## 2. Google Antigravity SDK

### 2.1 Setup & Installation

The Antigravity SDK is a programmatic Python framework providing direct access to the same agent runtime powering Antigravity 2.0 and the Antigravity CLI.

```bash
pip install google-antigravity
```

> **Note:** Always install via `pip` from PyPI — the SDK relies on a compiled runtime binary included in platform-specific wheels.

#### Quick Start

```python
import asyncio
from google.antigravity import Agent, LocalAgentConfig

async def main():
    config = LocalAgentConfig()

    async with Agent(config) as agent:
        response = await agent.chat("What files are in the current directory?")
        print(await response.text())

if __name__ == "__main__":
    asyncio.run(main())
```

Key features at a glance:
- Same agent runtime as Antigravity 2.0
- Custom tools, MCP support, agent skills
- Declarative safety policies + 9 lifecycle hook points
- Subagent spawning, structured output, multi-modal file ingestion
- Runtime-agnostic: prototype locally → deploy to cloud without rewrites

---

### 2.2 Agent Configuration

Agents are configured using `LocalAgentConfig` with a decoupled architecture:

```python
from google.antigravity import Agent, LocalAgentConfig

config = LocalAgentConfig(
    # System instructions (identity, domain guidance)
    system_instruction="You are a security auditor specialized in OWASP top 10...",

    # Custom tools (Python callables)
    tools=[my_custom_tool, another_tool],

    # Skill packages (reusable instruction + tool bundles)
    skills_paths=["./skills/security", "./skills/database"],

    # MCP server connections
    mcp_servers=[...],

    # Safety policies
    safety_policies=[...],
)

async with Agent(config) as agent:
    response = await agent.chat("Audit this codebase for SQL injection.")
```

#### Configuration Principles
- **Decoupled logic** — define behavior, tools, and policies in Python; SDK handles execution
- **Layered customization** — system instructions for identity, skills for domain expertise
- **Skills as packages** — reusable bundles of instructions, tools, and context via `skills_paths`

---

### 2.3 MCP Integration

The SDK provides **native MCP support** across three transport protocols:

| Transport | Use Case |
|:----------|:---------|
| **stdio** | Local tools, CLI-based servers |
| **SSE (Server-Sent Events)** | Streaming remote servers |
| **Streamable HTTP** | Standard remote API endpoints |

#### Key Integration Points
- **Unified pipeline** — MCP tools share the same execution pipeline, streaming infrastructure, and safety policies as built-in tools
- **No special treatment** — once connected, MCP tools are indistinguishable from native tools in the agent's toolbox
- **Policy enforcement** — all MCP tools respect the same `deny()`, `ask_user()`, and `allow()` policies

---

### 2.4 Lifecycle Hooks

The SDK provides **9 discrete hook points** across three categories:

#### Hook Categories

| Category | Behavior | Use Cases |
|:---------|:---------|:----------|
| **Inspect** | Read-only, non-blocking | Logging, telemetry, audit trails |
| **Decide** | Read-only, blocking | Custom approval, policy enforcement, human-in-the-loop |
| **Transform** | Modifying, blocking | Sanitize inputs/outputs, error recovery, data reshaping |

#### Hook Points

| Lifecycle Phase | Hook Points |
|:----------------|:------------|
| **Session** | Start, End |
| **Turn** | Pre-turn, Post-turn |
| **Tool Call** | Pre-tool call, Post-tool call, Tool error recovery |
| **Context** | Context compaction, User interaction handling |

#### Code Example

```python
from google.antigravity.hooks import post_tool_call, pre_tool_call
from google.antigravity.types import ToolResult, ToolCall

# INSPECT: Log every tool call
@post_tool_call
async def audit_log(result: ToolResult):
    print(f"Tool '{result.name}' completed with status: {result.status}")

# DECIDE: Block dangerous tool calls
@pre_tool_call
async def security_gate(call: ToolCall) -> bool:
    if call.name == "shell" and "rm -rf" in call.arguments.get("command", ""):
        return False  # Block the call
    return True  # Allow

# TRANSFORM: Sanitize outputs
@post_tool_call
async def sanitize_output(result: ToolResult) -> ToolResult:
    result.output = result.output.replace("SECRET_KEY", "[REDACTED]")
    return result
```

#### Hook Registration

```python
from google.antigravity import Agent, LocalAgentConfig

config = LocalAgentConfig(
    hooks=[audit_log, security_gate, sanitize_output]
)

async with Agent(config) as agent:
    response = await agent.chat("List all environment variables")
```

---

### 2.5 Structured Output

The SDK supports **Pydantic V2 schema validation** for typed, predictable agent responses:

```python
from pydantic import BaseModel, Field

class AnalysisResult(BaseModel):
    summary: str = Field(description="Brief summary of the analysis")
    confidence_score: float = Field(description="Confidence between 0 and 1")
    tags: list[str] = Field(description="Relevant keywords identified")
    recommendations: list[str] = Field(description="Actionable next steps")

# Request structured output
response = await agent.chat(
    "Analyze the authentication module for security issues",
    output_schema=AnalysisResult
)

# Automatically parsed into Pydantic model
result: AnalysisResult = response.structured_output
print(result.summary)
print(f"Confidence: {result.confidence_score}")
```

#### Best Practices
- Use descriptive `Field(description=...)` for clear agent guidance
- Keep schemas focused — one schema per intent
- Validate downstream — Pydantic handles parsing, but verify business logic

---

### 2.6 Custom Tools

Register any Python callable as a tool in the agent's toolbox:

```python
from google.antigravity import Agent, LocalAgentConfig

def query_database(sql: str) -> str:
    """Execute a read-only SQL query against the analytics database."""
    # Your DB logic here
    return f"Results for: {sql}"

def send_notification(channel: str, message: str) -> str:
    """Send a notification to the specified Slack channel."""
    # Your notification logic here
    return f"Sent to #{channel}: {message}"

config = LocalAgentConfig(
    tools=[query_database, send_notification]
)

async with Agent(config) as agent:
    response = await agent.chat("Get last week's signup count and notify #growth")
```

#### Key Points
- **Auto-inspection** — the SDK reads function signatures, type hints, and docstrings
- **Unified pipeline** — custom tools share execution pipeline and safety policies with built-ins
- **No special registration** — pass callables directly to `tools=[...]`

---

### 2.7 Subagents & Orchestration

The SDK supports **programmatic subagent spawning** for complex, parallel workflows:

#### When to Use Subagents

| Scenario | Use Subagent? |
|:---------|:-------------|
| Deep codebase search across multiple layers | ✅ Yes |
| Running test suites that produce noisy output | ✅ Yes |
| Independent parallel tasks (e.g., multi-file refactor) | ✅ Yes |
| Simple single-turn Q&A | ❌ No |
| Sequential, tightly coupled steps | ❌ No |

#### Orchestration Benefits
- **Context isolation** — prevents context window pollution in the main session
- **Parallel execution** — multiple child agents run simultaneously
- **Specialization** — different agents with different tools/skills
- **Cost efficiency** — route exploration to cheaper models

#### Architecture Principle

```
Main Agent (Orchestrator)
├── Subagent A: Security Audit     (specialized tools)
├── Subagent B: Test Execution     (test runner tools)
└── Subagent C: Code Search        (search + grep tools)
```

---

### 2.8 Security & Sandboxing

#### Built-in Security Primitives

| Feature | Description |
|:--------|:------------|
| **Kernel-level isolation** | Seatbelt (macOS) / equivalent (Linux/Windows) sandboxing |
| **Credential masking** | Prevents agents from reading/exposing env vars and tokens |
| **Declarative policies** | Deny-by-default, argument-level predicates per tool |
| **Git guardrails** | Block force-push, branch deletion, history modification |
| **Domain allow lists** | Restrict web access to approved URLs |

#### Policy Configuration

```python
from google.antigravity import SafetyPolicy

# Deny-by-default approach
policies = [
    SafetyPolicy.deny("shell", predicate=lambda args: "rm" in args.get("command", "")),
    SafetyPolicy.ask_user("shell", predicate=lambda args: "sudo" in args.get("command", "")),
    SafetyPolicy.allow("read_file"),
    SafetyPolicy.allow("grep"),
]

config = LocalAgentConfig(
    safety_policies=policies
)
```

#### Production Deployment Checklist

| Item | Action |
|:-----|:-------|
| **Resource limits** | Set CPU/memory caps for agent containers |
| **Network isolation** | Restrict outbound access; use allow lists |
| **Audit logging** | Enable lifecycle hooks for compliance trails |
| **Ownership labels** | Tag agents with team/project ownership |
| **Cost attribution** | Monitor and cap token usage per agent |
| **Strict mode** | Enable for manual review of terminal commands |
| **Policy layer** | Build org-specific monitoring, blocking, and logging |

---

## 3. Cross-Platform Comparison

| Dimension | Claude Code | Antigravity SDK |
|:----------|:------------|:----------------|
| **Primary Interface** | CLI / IDE | Python programmatic API |
| **Configuration** | `CLAUDE.md` + `settings.json` | `LocalAgentConfig` (Python) |
| **Hooks** | Shell-based (`PreToolUse`, `PostToolUse`) | Python decorators (9 hook points, 3 categories) |
| **MCP Support** | `.mcp.json` + CLI commands | Native `mcp_servers` config |
| **Safety** | Permission modes + JSON rules | Declarative `SafetyPolicy` objects |
| **Multi-Agent** | Task tool + Agent Teams (experimental) | Programmatic subagent spawning |
| **Structured Output** | N/A (text-based) | Pydantic V2 schema validation |
| **Custom Tools** | MCP servers only | Python callables + MCP servers |
| **Deployment** | Local CLI / IDE | Local → Cloud (runtime-agnostic) |
| **Language** | Any (shell-level control) | Python-first |
| **Best For** | Interactive development, code editing | Automated pipelines, backend agents, production deployment |

---

## 4. Anti-Patterns to Avoid

### Claude Code

| Anti-Pattern | Why It Fails | Alternative |
|:-------------|:-------------|:------------|
| **Bloated CLAUDE.md** (500+ lines) | Model ignores sections, adherence drops | Keep <200 lines, use `@import` |
| **Vague rules** ("write clean code") | Not falsifiable, inconsistent enforcement | Specific rules: "All async must have timeout" |
| **Prompt tunneling** | Sending messages without checking results | Always verify output, run tests |
| **Zero verification** | Accepting code without running tests | Give Claude verification commands |
| **Running as root** | Catastrophic blast radius | Standard user + OS sandboxing |
| **`Bash(*)` in allow list** | Bypasses all command safety | Granular allow/deny per command |
| **Skip permissions in production** | Full attack surface exposed | Docker isolation if bypass needed |

### Antigravity SDK

| Anti-Pattern | Why It Fails | Alternative |
|:-------------|:-------------|:------------|
| **No resource limits** | Runaway agents impact infrastructure | CPU/memory caps per container |
| **No policy layer** | Agents execute arbitrary operations | Deny-by-default policies |
| **Unmonitored agents** | Silent failures, compliance gaps | Audit logging via lifecycle hooks |
| **Monolithic agents** | Context pollution, slow responses | Subagent decomposition |
| **Cloning repo for SDK** | Missing compiled binaries | Always `pip install google-antigravity` |
| **No ownership labels** | Orphaned agents consume resources | Tag with team/project metadata |

---

> **Sources:** Research compiled from official documentation at `claude.com`, `antigravity.google`, community resources at `stevekinney.com`, `builder.io`, `codewithmukesh.com`, `panaversity.org`, `sfeir.com`, and `reddit.com` discussions. All findings reflect the state of both platforms as of May 2026.
