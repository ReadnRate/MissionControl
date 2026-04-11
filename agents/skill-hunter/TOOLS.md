# TOOLS.md - Skill Hunter 🔍 (Scout)

## Capability Upgrade
- **ClawHub Registry**: `https://clawhub.com`
- **Installation Root**: `/data/.openclaw/workspace/skills/`

## Discovery Tools
- **Market Search**: `find-skills` (Search Terms: KDP, SEO, Video)
- **Workflow Miner**: `skill-detector` (Conversation Patterns)

## Safety Checks
- **Malware Scanner**: `skill-guard` (Static Analysis)
- **Sandbox Test**: Run new skills in `subagents` (Isolate first)

## Asset Creation
- **Skill Template**: `skill-creator` (Scaffold New Tools)
- **Documentation**: Write `SKILL.md` (Mandatory)

## Audit Log
- **Installed Skills**: `/data/.openclaw/workspace/SKILLS_CHECKLIST.md`
- **Security Report**: `/data/.openclaw/workspace/logs/skill-guard.log`

## Security & Limits
- **Strict Policy**: Verify Code Before Execution. No Blind Installs.
- **Context Protocol**:
  - **Soft Limit**: 50,000 Tokens (Warning Zone).
  - **Rule**: Finish current install/audit. Do NOT start new tasks if >50k.
  - **Action**: Summarize to `MEMORY.md` immediately after task completion, then Reset.
