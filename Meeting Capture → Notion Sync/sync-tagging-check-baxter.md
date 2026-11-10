---
name: granola-sync-tagging-check-baxter
description: Temporary check (Nov 10–13, 2026) on the new project and Internal/External tagging in granola-to-notion-sync. DMs Rachel (sent as Baxter) what each new Team Granola Capture row was tagged, with anything that looks wrong flagged.
trigger_id: trig_01PoRKDxUB7VUvViNaYBuz2v
schedule: 12pm and 5pm ET, Nov 10–13, 2026 (0 17,22 10-13 11 * UTC, set during EST)
mcp_connections: Notion
slack_sender: Baxter bot ($BAXTER_TOKEN)
---

You check the Granola → Notion sync's new tagging rules (changed Nov 10, 2026) and tell Rachel how they did. You only read Notion; never edit a row.

## STEP 0 — STOP AFTER THE TRIAL
Get now in America/New_York (`TZ=America/New_York date`). If the date is after 2026-11-13, do nothing and stop.

## STEP 1 — NEW ROWS
Window: rows created since the previous check. For the 12pm run that is since 5pm ET on the previous weekday; for the 5pm run, since 12pm ET today. Never look before 2026-11-10T15:07:00Z (when the new rules went live).
Query Team Granola Capture with SQL (collection://0a856cd2-373b-826f-a55d-07b96b25a648): `url`, `createdTime`, `Title`, `date:Date:start`, `Folder`, `Sub-folder`, `Internal or External?`, `Projects`, `Sales Opportunity`, `Attendees`, filtered on `datetime(createdTime)` in the window. Resolve each Projects / Sales Opportunity page URL to its name (fetch, or SQL on Projects collection://7fe56cd2-373b-8368-a21c-87f2c9b61ec3 by `url`).

## STEP 2 — CHECK EACH ROW AGAINST THE RULES
The rules (Operations → Call Management, section 6):
- Internal/External: title prefix `Intro` / `NTN Connect` / `NTN Follow-up` / `NTN x` / `Now to Next x` → External, `INTERNAL` → Internal; else filed in Customer calls → External; else any attendee outside @nowtonext.ai → External.
- Project: named in the title → client sub-folder → content match on project descriptions → fallback Opportunity Tracking (External) or NTN Operations (Internal). Never blank.
Flag a row (⚠️) if: Projects is blank; External with NTN Operations; Internal with Opportunity Tracking; the label contradicts the title prefix; it has an outside attendee but is marked Internal; or the title names a project/client that exists but a different project was set.

## STEP 3 — DM RACHEL (always, once per run)
Send ONE Slack DM to Rachel (U0ACE0F48F6) via the Slack Web API using Baxter's bot token. Do NOT use any Slack MCP tool. The token is in the `BAXTER_TOKEN` environment variable: reference it only as `$BAXTER_TOKEN` inside curl headers. NEVER echo, print, or log it.
- Open the DM: POST https://slack.com/api/conversations.open `{"users": "U0ACE0F48F6"}` → `channel.id`
- Send: POST https://slack.com/api/chat.postMessage with header `Authorization: Bearer $BAXTER_TOKEN`, body `{"channel": "...", "text": "🔎 Granola sync tagging check", "blocks": [...]}`. Build the JSON with Python (json.dumps) and send with curl `--data-binary @file`; keep each section block under 2,900 characters. One message only.
Message:
"🔎 *Granola sync tagging check* — [day, 12pm/5pm] ([N] new rows since [time])
• <[row url]|[Title]> — [Internal/External] → *[Project]*[ · opp: [Sales Opportunity]]
• ⚠️ <[row url]|[Title]> — [Internal/External] → *[Project or blank]* — [why it looks wrong]
_[F] flagged · rules: Call Management §6 · trial ends Fri Nov 13_"
Put flagged rows first. If more than 25 rows, list the flagged ones plus the first unflagged ones up to 25 and add "+N more". If there are no new rows, send: "🔎 *Granola sync tagging check* — [day, time]: no new rows since [time]."
On the 5pm run on 2026-11-13, add a last line: "_Last check of the trial. Tell Claude to keep or retire this check._"

## RULES
- Read-only in Notion. Never change a row, project or task.
- One DM per run.
