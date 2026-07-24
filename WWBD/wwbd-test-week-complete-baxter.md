---
name: wwbd-test-week-complete-baxter
description: One-time notification firing Aug 4 at 9am EDT. Tells Rachel the WWBD test week is done and asks if she wants to roll it out to the full team.
trigger_id: trig_012Wvc2vmDfYzALEabLrVsp6
schedule: One-time — Aug 4, 2026 at 9am EDT (0 13 4 8 *)
mcp_connections: none
slack_sender: Baxter bot ($BAXTER_TOKEN)
---

Send Rachel a Slack DM via Baxter notifying her that the WWBD test week is complete and asking whether to roll it out to the full team.

## SLACK — VIA BAXTER (CURL)
Do NOT use the Slack MCP tool.

**Baxter's bot token:** Stored in the `BAXTER_TOKEN` environment variable. Run `echo $BAXTER_TOKEN` in Bash to retrieve it.

**To DM Rachel (U0ACE0F48F6):**
1. POST to `https://slack.com/api/conversations.open` with body `{"users": "U0ACE0F48F6"}` and header `Authorization: Bearer $BAXTER_TOKEN`. Extract `channel.id`.
2. POST to `https://slack.com/api/chat.postMessage` with body `{"channel": "CHANNEL_ID", "text": "YOUR MESSAGE", "mrkdwn": true}` and the same Authorization header.

## MESSAGE TO SEND

```
🤖 *WWBD test week is done!*

You've received 5 daily tips this week (Jul 28 – Aug 1). Ready to roll it out to the rest of the team?

Just let me know and I'll update the routine to include everyone. Or if you want to tweak the format, timing, or sources first — say the word.
```

Send the message, then finish silently.
