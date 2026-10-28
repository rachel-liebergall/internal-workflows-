# Baxter Reply Router

One hourly routine that picks up replies people send to Baxter and routes each one to the workflow that sent the original message, so individual workflows don't need their own reply-polling schedules. Added Oct 27, 2026.

## How it works

Runs hourly at :35 past, 9:35am–6:35pm EDT, weekdays. Each run:

1. Lists every conversation Baxter is in (DMs, group DMs, channels), except the daily-task channels (`#rachel-daily-`, `#patrick-daily`), which [daily-tasks-reply-sweep-baxter](../Daily%20Tasks%20Pilot%20(Baxter)/README.md) handles.
2. Finds Baxter's messages from the last 7 days that have thread replies, and keeps only **new** human replies: posted after Baxter's last message in the thread, and after the router started (Oct 27, 2026 10:45 ET).
3. Routes each thread by the first line of Baxter's message:

| Baxter message | Sent by | What replies can do |
| --- | --- | --- |
| 📋 HubSpot → Notion → Drive | [HubSpot Event Project Creator](../HubSpot%20Event%20Project%20Creator/README.md) | `1 yes` / `1 no` / `1 → [project]` / `2 → [folder]` / `skip 3` (Rachel only) |
| 📂 Quick Drive check-in | [Drive audit](../Notion%20Project%20Drive%20Sync/README.md) manager nudge | "Uploaded" → checks the folder now has files and thanks them; anything else is forwarded to Rachel |
| 🔍 Drive ↔ Notion Audit | Drive audit report | Move a folder, link a folder, set a project Manager (Rachel only) |
| Anything else | Any workflow without reply handling | Not acted on; forwarded to Rachel in one "↩️ Replies to Baxter that need you" digest |

4. Confirms in each thread it handled with a message starting "↩️" ("↩️ Done ✅ …" or "↩️ … passed to Rachel"). That marker is what marks replies as handled, so they're never processed twice. Other Baxter messages in the thread (e.g. reflection-pilot auto-replies) don't count.

Replies don't need a format: the numbered commands are shortcuts. The router also understands names ("the Michigan one"), plain yes/no, and answers to its own follow-up question. If it's unsure, it asks one specific question with its best guess instead of asking you to reformat.

If there's nothing new, it does nothing.

## Configuration

| Field | Value |
| --- | --- |
| Routine ID | `trig_018gL1VYvwBLyXAYngypveuh` |
| Schedule | `35 13-22 * * 1-5` (UTC) |
| MCP Connections | HubSpot, Notion, Google Drive |
| Slack | Baxter bot via `$BAXTER_TOKEN` (curl); no Slack MCP |
| Prompt | [baxter-reply-router.md](baxter-reply-router.md) |

## Notes

- The HubSpot Event Project Creator still applies any unhandled replies at its 9am run (same rules), so overnight replies are picked up first thing.
- Known conflict (confirmed Oct 28, 2026): Baxter's Slack app has a "Rachel-only Baxter DM pilot" trigger that relays every message Rachel posts in her Baxter DM, thread replies included, to the OpenAI-hosted reflection agent. That agent may answer with its own format rules. The routines ignore its replies, but Rachel still sees them until the trigger is removed.
