# TOOLS.md - Joe 🦞 (Orchestrator)

## Agent Coordination
- **Team Roster**: `/data/.openclaw/workspace/AGENTS.md`
- **Agent Workspaces Root**: `/data/.openclaw/workspace/agents/`

## Core Utilities
- **Process Management**: `subagents` tool (list/steer/kill)
- **File Operations**: `read`, `write`, `edit` (Global Access)
- **System Command**: `exec` (Global Access)
- **Token Manager**: `session_status` (Check usage)

## Communication Channels
- **Web Chat**: Primary interface with Manuel
- **AgentMail**: `joebot@agentmail.to` (Inbox ID: `inbox_01`)
- **Notifications**: `/data/.openclaw/workspace/bin/send-morning-brief.sh`

## Memory & Context
- **Global Memory**: `/data/.openclaw/workspace/MEMORY.md` (The Source of Truth)
- **Task Board**: `/data/.openclaw/workspace/TASKS.md`
- **Context Protocol**:
  - **Soft Limit**: 50,000 Tokens (Warning Zone).
  - **Rule**: Finish current atomic task. Do NOT start new tasks if >50k.
  - **Action**: Summarize to `MEMORY.md` immediately after task completion, then Reset.

## Security Protocols
- **API Keys**: Located in `~/.openclaw/env` (DO NOT PRINT)
- **Allowed Domains**: `*.oliverowl.com`, `*.readnrate.com`, `*.trym.app`
