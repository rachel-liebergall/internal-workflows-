# Granola → Notion Sync — Scheduled Routine

## Overview

Automated routine that pulls completed meetings from Granola and syncs them as rows into the **Team Granola Capture** Notion database. Runs hourly during the workday in Anthropic's cloud — independent of your laptop being on or connected. Skips meetings already in Notion to prevent duplicates.

## Schedule

**Hourly at :16, 7am–7pm EDT, weekdays** (`16 11-23 * * 1-5` UTC)

Runs as a remote trigger in Anthropic's cloud infrastructure. Laptop does not need to be on or connected.

## Routine ID

`trig_013dtp9xwm17AkWeFjEwjhdx`

Manage at: https://claude.ai/code/routines/trig_013dtp9xwm17AkWeFjEwjhdx

## Scope

Scans the **Nowtonext** enterprise workspace (ID: `711732b8-9958-4c2c-9427-572bc064f857`) on the Granola enterprise account (`rachel@nowtonext.ai`). Each run checks the last 3 days of meetings, plus Team-space notes from the last 30 days (to catch notes filed into a team folder after the meeting). Aborts if the active workspace is not Nowtonext.

## Databases

| Database | Purpose | Notion ID / Data Source |
|---|---|---|
| Team Granola Capture | Destination — one row per meeting | `46756cd2-373b-8263-a24d-01539a3d97cf` |
| Projects | Project relation mapping | `collection://7fe56cd2-373b-8368-a21c-87f2c9b61ec3` |
| Sales Opportunities | Sales opportunity relation mapping (when project = Opportunity Tracking) | `collection://05d73447-11f8-439f-9ca9-00c6a1a6fec2` |

## Workflow

### Step 1 — Fetch recent Granola meetings
Calls `list_meetings` twice: the last 3 days, and `workspace_only` for the last 30 days (late-filed team notes). Merges by meeting ID and calls `list_meeting_folders` for folder names. Filters to the Nowtonext workspace only.

### Step 2 — Skip already-synced meetings
Loads rows from the last 45 days once with SQL (never `notion-search`, which is fuzzy) and skips a meeting **only** if one of these matches:
1. **Same Granola ID** — the UUID at the end of an existing row's Transcript Link (any URL format: `/d/`, `/meetings/`, …)
2. **Same title, same day** — same normalized title on the same calendar date (same title on a different day is a recurring meeting and is added)
3. **Same start time + shared attendee** — starts within 15 minutes of an existing row and shares at least one attendee (two teammates recording the same call under different titles). Only applies to rows whose Date includes a time.

Everything else is added — **when unsure, add**. Rows created during the run are added to the comparison set immediately, and the ID is re-checked with a fresh SQL query right before each create.

Meetings with no AI summary are retried for 2 days, then added with "No Granola summary available."

### Step 3 — Get full meeting details
Retrieves AI summary, action items, participants, transcript URL, folder/subfolder and start time. Meetings with no AI summary are retried for up to 2 days, then added anyway.

### Step 4 — Determine column values

**Folder & Sub-folder**
Top-level and nested Granola folder the meeting belongs to.

**Internal or External?**
First rule that applies (title prefixes from Call Management):
- Title starts with "Intro", "NTN Connect", "NTN Follow-up", "NTN x ", "Now to Next x " → **External**; starts with "INTERNAL" → **Internal**
- In "Customer calls" (or a sub-folder), or folder contains "Customer", "Client", "External", "Partner" → **External** ("Team Nowtonext" is not a signal)
- Fallback: any non-@nowtonext.ai attendee → External; all @nowtonext.ai → Internal

**Summary**
Full Granola AI summary, condensed to key bullet points if >2000 characters.

**To-dos**
All action items extracted from summary/transcript:
`• [owner if known] action item`

**Transcript Link**
Granola share link if available, otherwise: `https://notes.granola.ai/d/{meeting_id}` (must end with the meeting ID)

**Date**
Meeting start date and time (America/New_York).

**Attendees**
All participant emails as multi-select. New options added automatically.

**Created by**
Always `rachel@nowtonext.ai`

**Projects (relation)**
- `INTERNAL: Working Session` with no "<>" (general team working session) → "NTN Operations", no content matching
- Project or client named in the title (text after "<>", or the client in `NTN Follow-up:` / `NTN x [Client]:`) → fuzzy match against project names
- Sub-folder set → fuzzy match against project names
- Otherwise → match the meeting's content (summary, attendees' companies, named client/event/deliverable) against each project's description, notes, tags, speakers and event date
- No confident match + External meeting → "Opportunity Tracking" project
- No confident match + Internal meeting → "NTN Operations" project

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
- Every completed Granola meeting from the last 3 days, and every Team-space note from the last 30 days, appears as exactly one row
- Internal/External classified correctly
- Projects relation mapped when a confident match exists

## Notes
- Migrated from Claude Code desktop local scheduler to remote trigger on 2026-05-18
- Remote trigger runs independently of user's device
- Be conservative on specific project matching — the Opportunity Tracking / NTN Operations fallback is better than a wrong project
- Oct 16, 2026: dedupe rebuilt on exact Granola-ID matching (old check looked for `/meetings/` links while saved links are `/d/`), schedule set to weekdays 7am–7pm; skip only on a certain match (same ID, same title same day, or same start time + shared attendee), otherwise add
- Nov 5, 2026: added a 30-day Team-space pass. Teammates' notes filed into a team folder more than 3 days after the meeting were never synced (8 of 39 in the prior 30 days). Existing-row check widened from 14 to 45 days to match.
- Nov 10, 2026: project and Internal/External rules aligned with Call Management. Internal meetings with no match had been left blank (e.g. every "Bi-Weekly Team Engineering Sesh"); they now match on project descriptions/details and otherwise default to NTN Operations. The "Team" folder keyword was dropped because it marked client calls filed in Team Nowtonext as Internal. Applies going forward only; existing rows were not changed.
- Nov 10, 2026 (later): general team working sessions. `INTERNAL: Working Session` with no "<>" always goes to NTN Operations; `INTERNAL: Working Session <> [Project]` uses the named project. Matches Call Management.
