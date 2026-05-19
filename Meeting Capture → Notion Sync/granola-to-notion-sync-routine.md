# Granola → Notion Sync — Scheduled Routine

## Overview

Automated routine that pulls completed meetings from Granola and syncs them as rows into the **Team Granola Capture** Notion database. Runs hourly in Anthropic's cloud — independent of your laptop being on or connected. Skips meetings already in Notion to prevent duplicates.

## Schedule

**Every 2 hours, 7am–7pm EDT** (`0 11,13,15,17,19,21,23 * * *` UTC)

Runs as a remote trigger in Anthropic's cloud infrastructure. Laptop does not need to be on or connected.

## Routine ID

`trig_013dtp9xwm17AkWeFjEwjhdx`

Manage at: https://claude.ai/code/routines/trig_013dtp9xwm17AkWeFjEwjhdx

## Scope

Scans the **Nowtonext** enterprise workspace (ID: `711732b8-9958-4c2c-9427-572bc064f857`) on the Granola enterprise account (`rachel@nowtonext.ai`). Each run checks the last 24 hours of meetings. Aborts if the active workspace is not Nowtonext.

## Databases

| Database | Purpose | Notion ID / Data Source |
|---|---|---|
| Team Granola Capture | Destination — one row per meeting | `46756cd2-373b-8263-a24d-01539a3d97cf` |
| Projects | Project relation mapping | `collection://7fe56cd2-373b-8368-a21c-87f2c9b61ec3` |
| Sales Opportunities | Sales opportunity relation mapping (when project = Opportunity Tracking) | `collection://05d73447-11f8-439f-9ca9-00c6a1a6fec2` |

## Workflow

### Step 1 — Fetch recent Granola meetings
Calls `list_meetings` with `time_range="last_1_day"` and `list_meeting_folders` for folder names. Filters to the Nowtonext workspace only.

### Step 2 — Skip already-synced meetings
For each meeting, checks:
1. **Transcript Link match** — existing row whose Transcript Link contains the Granola meeting ID
2. **Title match** — existing row with the same title

Skips if either check matches. Prevents duplicates even if a meeting was captured by another workflow.

### Step 3 — Get full meeting details
Retrieves AI summary, action items, participants, transcript URL, and folder/subfolder. Skips meetings with no AI summary (not yet complete).

### Step 4 — Determine column values

**Folder & Sub-folder**
Top-level and nested Granola folder the meeting belongs to.

**Internal or External?**
Classified by folder name first, attendee domains as fallback:
- Folder contains "Customer", "Client", "External", "Partner", "Sales" → **External**
- Folder contains "Internal", "Team", "Standup", "All-hands", "1:1" → **Internal**
- Fallback: any non-@nowtonext.ai attendee → External; all @nowtonext.ai → Internal

**Summary**
Full Granola AI summary, condensed to key bullet points if >2000 characters.

**To-dos**
All action items extracted from summary/transcript:
`• [owner if known] action item`

**Transcript Link**
Granola share link if available, otherwise: `https://notes.granola.ai/meetings/{meeting_id}`

**Attendees**
All participant emails as multi-select. New options added automatically.

**Created by**
Always `rachel@nowtonext.ai`

**Projects (relation)**
- Sub-folder set → fuzzy match against project names
- No sub-folder → match by attendee company domain
- Internal meeting → match by meeting title keywords
- No confident match + External meeting → defaults to "Opportunity Tracking" project
- No confident match + Internal meeting → left blank

**Sales Opportunity (relation)**
- Only runs when Projects resolves to "Opportunity Tracking"
- Company name derived from sub-folder (primary) or external attendee email domain (fallback)
- Fuzzy match against the Company field in Sales Opportunities database
- Excludes Closed Won / Closed Lost opportunities
- No confident match → left blank (conservative)

### Step 5 — Create the row
Creates a new page in Team Granola Capture with all columns populated.

## MCP Connections

| Service | Connector |
|---|---|
| Granola | claude.ai Granola MCP |
| Notion | claude.ai Notion MCP |

## Success Criteria
- Every completed Granola meeting from the last 24 hours appears as a row (if not already synced)
- No duplicate rows
- Internal/External classified correctly
- Projects relation mapped when a confident match exists

## Notes
- Migrated from Claude Code desktop local scheduler to remote trigger on 2026-05-18
- Remote trigger runs independently of user's device
- Be conservative on Projects matching — blank is better than wrong
