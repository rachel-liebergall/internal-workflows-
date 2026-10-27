---
name: hubspot-project-creator-check-baxter
description: Temporary check (Wed Oct 28 + Thu Oct 29, 2026, 9:30am ET). Verifies that what hubspot-event-project-creator-baxter reported in its 9am DM (projects, folders, HubSpot links, applied replies) really happened, and DMs Rachel a short check-in. Read-only. Disable after Oct 29.
trigger_id: trig_01GTLmDEWmcUm1ZXbTBydKzi
schedule: 30 13 28,29 10 * (UTC)
mcp_connections: Notion, HubSpot, Google Drive
slack_sender: Baxter bot ($BAXTER_TOKEN)
---

See the live routine for the full prompt. Steps: find today's "📋 HubSpot → Notion → Drive" DM and any "Done ✅" thread replies → verify each claim against Notion, HubSpot and Drive → DM Rachel "🔎 Check-in" with Verified / Didn't match / Waiting on you / Format.
