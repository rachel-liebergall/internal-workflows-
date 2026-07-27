# EOD Task Check-In

A two-part daily routine that sends each NTN team member a personalized end-of-day task list, reads their replies, and updates Notion automatically.

## What It Does

Two routines run back-to-back each weekday:

**Part 1 — Check-In (4pm EDT):** For each team member, queries their open Notion tasks (overdue, due this week, and ongoing) and sends a personalized Slack DM asking for a status update.

**Part 2 — Updater (7pm EDT):** Reads each team member's thread replies and direct DM responses to the check-in message, then:
1. Marks tasks as Done in Notion if the person says they finished
2. Adds a timestamped comment to tasks if the person gives a status update
3. Replies in thread to confirm what was updated

## Notion Database

**Tasks** — `36e56cd2373b8325939281a80a6cb5d9`

| Property | Type | Description |
| --- | --- | --- |
| Task Name | Title | Task title |
| Assign | Person | Notion user assigned to the task |
| Due Date | Date | Single date or date range |
| Status | Status | Backlog, Not started, To Review, In progress, On Hold, Ongoing, Done, Cancelled |
| Project | Relation | Linked project page |

## How It Works

1. At 4pm, each team member gets a DM listing their overdue tasks, tasks due this week, and ongoing tasks
2. They reply in the thread (or DM directly) with updates: "done," "still working on it," "blocked," etc.
3. At 7pm, the updater reads all replies and automatically updates Notion status or adds comments
4. The updater replies in the same thread to confirm what changed

If a team member has no open tasks, they receive no message.

## Schedule

| Routine | Schedule |
| --- | --- |
| Check-In | Weekdays at 4pm EDT |
| Updater | Weekdays at 7pm EDT |

## Routine Configuration

| Field | Check-In | Updater |
| --- | --- | --- |
| Routine ID | `trig_01FjUKCueivNvLvfTaEXHkb2` | `trig_01SZQ1Bs2xzZp1DswpMMPhY4` |
| Model | claude-sonnet-4-6 | claude-sonnet-4-6 |
| Schedule | `0 20 * * 1-5` (4pm EDT) | `0 23 * * 1-5` (7pm EDT) |
| MCP Connections | Notion | Notion |
| Slack Sender | Baxter (`$BAXTER_TOKEN`) | Baxter (`$BAXTER_TOKEN`) |
| Tasks DB ID | `36e56cd2373b8325939281a80a6cb5d9` | `36e56cd2373b8325939281a80a6cb5d9` |

## Recreating This Routine

If you need to recreate either routine:

1. Go to [claude.ai/code/routines](https://claude.ai/code/routines) and create a new routine
2. Set the schedule (see table above)
3. Attach the **Notion** MCP connector
4. Add `BAXTER_TOKEN` as an environment variable
5. Paste the prompt from `eod-task-checkin-baxter.md` or `eod-task-updater-baxter.md` as the agent instructions
