#!/bin/bash
# ============================================================
# Morning Brief — Read & Rate / Trym
# Sends a daily intelligence brief to Manuel
# ============================================================

export GOG_KEYRING_PASSWORD=$(cat /data/.openclaw/workspace/credentials/.gog_keyring_password)
export GOG_ACCOUNT=manu.denault@gmail.com

DATE=$(TZ=America/New_York date +"%Y-%m-%d")
TIME=$(TZ=America/New_York date +"%H:%M")
WORKDIR="/data/.openclaw/workspace"
TMP_EMAIL_REPORT="/tmp/email-analyzer-report.md"
TMP_RELEVANT_COUNT="/tmp/email-relevant-count.txt"
TMP_BRIEF_BODY="/tmp/morning-brief-body.txt"

echo "=== Morning Brief — $DATE $TIME ==="

# ── 1. Run Email Analyzer ──────────────────────────────────
echo "Running email analyzer..."
node "$WORKDIR/bin/morning-brief-email-analyzer.js" > /tmp/email-analyzer-output.txt 2>&1 || true

RELEVANT_COUNT=$(cat "$TMP_RELEVANT_COUNT" 2>/dev/null || echo "0")

# ── 2. Build the full brief ─────────────────────────────────
EMAIL_REPORT=$(cat "$TMP_EMAIL_REPORT" 2>/dev/null || echo "_Aucun email analyzer report disponible._")

cat > "$TMP_BRIEF_BODY" << BRIEF_EOF
🤖 **Morning Brief — $DATE — $TIME EST**

---

## 📅 Résumé du jour

Bonjour Manuel ! Voici ton briefing matinal pour Read & Rate et Trym.

---

## 📬 Emails analysés (7 derniers jours)

$EMAIL_REPORT

---

## 🚀 Voir dans Mission Control

→ **https://mission-control.readnrate.com**

| Section | URL |
|---------|-----|
| Dashboard | / |
| Tasks | /tasks |
| **Emails (ACTION REQUISE)** | **/emails** |
| Intel | /intel |
| Roadmap | /roadmap |

---

_Ce rapport a été généré automatiquement par Joe le ${DATE} à ${TIME} EST._
_Brief envoyé par Morning Brief System — www.readnrate.com
BRIEF_EOF

# ── 3. Send via Gmail ───────────────────────────────────────
echo "Sending brief to Manuel..."
gog gmail send \
  --to "manu.denault@gmail.com" \
  --subject "🤖 Morning Brief — $DATE — Read & Rate / Trym ($RELEVANT_COUNT email(s) à traiter)" \
  --body-file "$TMP_BRIEF_BODY" \
  2>&1 || echo "Send attempted (check gog status)."

echo "=== Brief complete at $(date) ==="
echo "$DATE" > "$WORKDIR/.last_brief_sent"
