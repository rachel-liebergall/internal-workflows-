# Meeting Capture → Notion Sync

A scheduled Claude agent that syncs completed Granola meeting notes to the **Team Granola Capture** Notion database hourly throughout the workday (weekdays).

## What It Does

Runs hourly at :16, 7am–7pm EDT, weekdays. On each run it:

1. Pulls all completed meetings from Granola (Nowtonext workspace) for the past 3 days (so Friday-evening meetings are caught on Monday)
2. Skips a meeting only if it's already in Notion, using exact checks on rows loaded by SQL (no fuzzy search): (1) same Granola ID — the UUID at the end of the Transcript Link, any URL format; (2) same title on the same day; or (3) a start time within 15 minutes plus a shared attendee (the same call recorded by two teammates). **When unsure, it adds the meeting** — Rachel would rather see an occasional duplicate than add meetings by hand. Meetings with no Granola summary after 2 days are added anyway.
3. Fetches full meeting details: AI summary, action items, participants, transcript URL, folder/subfolder
4. Classifies each meeting as Internal or External based on the Granola folder name (attendee domains as fallback)
5. Maps the meeting to a Notion project via fuzzy folder/company name matching; defaults to "Opportunity Tracking" for unmatched external meetings
6. Sets the Sales Opportunity relation when the project resolves to "Opportunity Tracking" and a company match is found
7. Creates a new row in Team Granola Capture with all columns populated

## Notion Database

**Team Granola Capture** (inside NTN Project Manager)
- Page ID: `46756cd2-373b-8263-a24d-01539a3d97cf`

| Column | Type | Description |
| --- | --- | --- |
| Title | Title | Meeting name |
| Date | Date | Meeting start date and time (time is used for dedupe) |
| Created by | Text | Always rachel@nowtonext.ai |
| Attendees | Multi-select | All participant emails |
| Summary | Text | Granola AI summary |
| Transcript Link | URL | Granola share link or constructed URL |
| Folder | Text | Top-level Granola folder |
| Sub-folder | Text | Nested Granola subfolder, if any |
| To-dos | Text | Extracted action items |
| Internal or External? | Select | Internal / External |
| Projects | Relation | Matched Notion project |
| Sales Opportunity | Relation | Matched sales opportunity (External only) |

## Schedule

- **Automatic:** Hourly at :16, 7am–7pm EDT, weekdays

## Routine Configuration

| Field | Value |
| --- | --- |
| Routine ID | `trig_013dtp9xwm17AkWeFjEwjhdx` |
| Model | claude-sonnet-4-6 |
| Schedule | `16 11-23 * * 1-5` (hourly, 7am–7pm EDT, weekdays) |
| MCP Connections | Granola, Notion |
| Granola Workspace | Nowtonext (`711732b8-9958-4c2c-9427-572bc064f857`) |
| Granola Account | rachel@nowtonext.ai |

## Recreating This Routine

1. Go to [claude.ai/code/routines](https://claude.ai/code/routines) and create a new routine
2. Set the schedule to `16 11-23 * * 1-5`
3. Attach the **Granola** and **Notion** MCP connectors
4. Paste the prompt from `agent-instructions.md` as the agent instructions

## Why dedupe matters

Every new row triggers the Notion agent "Meeting <> Tasks Follow-up Curator", which creates follow-up tasks. Before Oct 16, 2026 the dedupe looked for `/meetings/{id}` links while saved links use `/d/{id}`, and used fuzzy `notion-search` for titles, so the same meeting was re-added on later runs (about 42 duplicate rows Oct 1–16).
