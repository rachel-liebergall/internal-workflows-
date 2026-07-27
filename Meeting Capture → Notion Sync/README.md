# Meeting Capture → Notion Sync

A scheduled Claude agent that syncs completed Granola meeting notes to the **Team Granola Capture** Notion database every 2 hours throughout the workday.

## What It Does

Runs every 2 hours, 7am–7pm EDT. On each run it:

1. Pulls all completed meetings from Granola (Nowtonext workspace) for the past 24 hours
2. Deduplicates against existing Notion rows by transcript link and title
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
| Date | Date | Meeting date |
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

- **Automatic:** Every 2 hours, 7am–7pm EDT

## Routine Configuration

| Field | Value |
| --- | --- |
| Routine ID | `trig_013dtp9xwm17AkWeFjEwjhdx` |
| Model | claude-sonnet-4-6 |
| Schedule | `0 11,13,15,17,19,21,23 * * *` (every 2h, 11am–11pm UTC / 7am–7pm EDT) |
| MCP Connections | Granola, Notion |
| Granola Workspace | Nowtonext (`711732b8-9958-4c2c-9427-572bc064f857`) |
| Granola Account | rachel@nowtonext.ai |

## Recreating This Routine

1. Go to [claude.ai/code/routines](https://claude.ai/code/routines) and create a new routine
2. Set the schedule to `0 11,13,15,17,19,21,23 * * *`
3. Attach the **Granola** and **Notion** MCP connectors
4. Paste the prompt from `agent-instructions.md` as the agent instructions
