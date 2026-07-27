# Meeting Prep → Slack Notifications

A scheduled Claude agent that automatically detects upcoming external meetings, creates Notion prep guides with full context from HubSpot and Granola, and sends pre-meeting Slack reminders to all NTN attendees.

## What It Does

Runs every hour, 5am–5pm EDT on weekdays. On each run it:

1. Scans Google Calendar across Rachel, Jess, and Jason's calendars for external meetings in the next 4 days
2. Checks whether each meeting already has a prep guide in Notion — avoids creating duplicates
3. Creates new Notion prep guides for meetings that don't have one, pulling context from HubSpot, Granola, and Notion Projects
4. Sends a pre-meeting Slack DM to each NTN attendee ~1 hour before the meeting starts
5. Tracks notification state in each guide's Owner Notes field (`48h_sent`, `premeet_sent`)

## Notion Database

**Prep Guides** — `74a287e66d934e118e772a07f2e175e7`

| Property | Type | Description |
| --- | --- | --- |
| Title | Title | [Company] — Prep Guide |
| Meeting Date | Date | Meeting start date |
| Status | Status | Draft → Ready |
| Project | Relation | Matched Notion project |
| Owner Notes | Text | Notification flags: 48h_sent, premeet_sent |

### Prep Guide Sections

At-a-glance · Executive Summary · Meeting Objective · Stakeholders · Relationship Context · Recent Developments · Risks & Watchouts · Opportunities · Recommended Talking Points · Recommended Questions · Suggested Strategy · Action Checklist

## Schedule

- **Automatic:** Every hour, 5am–5pm EDT on weekdays

## Routine Configuration

Two variants exist — Baxter sends Slack via curl, MCP variant uses the Slack connector:

| Field | Baxter Variant | MCP Variant |
| --- | --- | --- |
| Routine ID | `trig_01CX4wM7dXB2RaiBkhWjwnKE` | `trig_01WBcMghXrtHZzYuoBBy52Ba` |
| Model | claude-sonnet-4-6 | claude-sonnet-4-6 |
| Schedule | `0 9-21 * * 1-5` | `0 9-21 * * *` |
| MCP Connections | Google Calendar, Notion, HubSpot, Granola | Google Calendar, Notion, HubSpot, Granola, Slack |
| Slack Sender | Baxter (`$BAXTER_TOKEN`) | Slack MCP |
| Prep Guides DB | `74a287e66d934e118e772a07f2e175e7` | `74a287e66d934e118e772a07f2e175e7` |

## Recreating This Routine

1. Go to [claude.ai/code/routines](https://claude.ai/code/routines) and create a new routine
2. Set the schedule to `0 9-21 * * 1-5`
3. Attach **Google Calendar**, **Notion**, **HubSpot**, and **Granola** MCP connectors
   - Baxter variant: add `BAXTER_TOKEN` as an environment variable
   - MCP variant: also attach the **Slack** MCP connector
4. Paste the prompt from `meeting-prep-routine-baxter.md` or `meeting-prep-routine.md` as the agent instructions
