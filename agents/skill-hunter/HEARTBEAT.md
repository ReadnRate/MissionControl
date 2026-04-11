# HEARTBEAT.md - Skill Hunter 🔍

## Discovery Routine (Weekly/On-Demand)
- **Check**: ClawHub for new, highly-rated skills.
- **Action**: Propose installation if relevant to Read & Rate/Trym.

## 🧠 Workflow Analysis (Daily)
- **Trigger**: Check `TASKS.md` and `MEMORY.md` of other agents for "Struggle" signals.
- **Action**: Run `skill-detector` on recent logs/tasks to identify automation opportunities.
- **Output**: Suggest 1 new skill or script to improve efficiency.

## Maintenance
- **Check**: Are installed skills outdated?
- **Tool**: `clawhub update` (via skill-detector/find-skills).

## Self-Check
- **Safety**: Have I scanned all new skills with `skill-guard`?
- **Documentation**: Does every skill have a `SKILL.md`? If not, create one.