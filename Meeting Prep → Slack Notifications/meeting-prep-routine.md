# Meeting Prep Guide Creator — Scheduled Routine

## Overview

Automated routine that runs hourly, detects upcoming external client meetings, creates a meeting prep guide in Notion, and sends Slack DMs to all NTN team members on the invite. Three-touch notification cadence: 48 hours before, morning of, and 30 minutes before.

## Schedule

**Every hour, 5am–5pm EDT** (`0 9-21 * * *` UTC)

Runs as a remote trigger in Anthropic's cloud infrastructure. Laptop does not need to be on or connected.

## Routine ID

`trig_01WBcMghXrtHZzYuoBBy52Ba`

Manage at: https://claude.ai/code/routines/trig_01WBcMghXrtHZzYuoBBy52Ba

## Trigger

Any Google Calendar event that:
- Has at least one external attendee (non-@nowtonext.ai)
- Is not an all-day event
- Appears on Rachel, Jess, or Jason's calendar

No manual labeling or tagging required — the routine detects meetings automatically.

## Team

| Name | Email | Slack ID |
|---|---|---|
| Rachel | rachel@nowtonext.ai | U0ACE0F48F6 |
| Jess | jess@nowtonext.ai | U09V5NP3U00 |
| Jason | jason@nowtonext.ai | U090GCJNP2N |

Notifications go to each NTN team member who is on the meeting invite.

## Notification Cadence

| Trigger | Window | Message |
|---|---|---|
| 48h prep | 47–49 hours before start | Silent — marks `48h_sent` flag only |
| Pre-meeting | 30–90 minutes before start (~1 hour) | Final alert with Notion link |

> Morning notifications (tasks + meetings combined) are handled by the **daily-task-roundup** routine, not this one.

Duplicate prevention: sent flags (`48h_sent`, `premeet_sent`) are stored in the Notion prep guide's Owner Notes field.

## Workflow

### Step 1 — Get current time
Fetches UTC time for use in notification window calculations. Meeting times in messages are parsed from the local time embedded in each event's ISO 8601 datetime string, so each person sees times in their own timezone.

### Step 2 — Fetch upcoming external meetings
Scans all three team calendars for the next 4 days. Filters to external meetings. Deduplicates meetings that appear on multiple calendars.

### Step 3 — Determine action needed per meeting
Checks hours until start and which notification windows apply. Looks up existing prep guide in Notion to avoid duplicates.

### Step 4 — Match to Notion project
Searches the Projects database for a project whose `Project Name` contains the company name (case-insensitive). Sets the `Project` relation if exactly one match is found. Leaves blank if zero or multiple matches (conservative).

### Step 5 — Create prep guide in Notion
Creates a new page in the Prep Guides database with a full meeting brief:
- At-a-glance (company, contacts, NTN team, date)
- Executive Summary
- Meeting Objective
- Stakeholders
- Relationship Context
- Recent Developments
- Risks & Watchouts
- Opportunities
- Recommended Talking Points
- Recommended Questions
- Suggested Strategy
- Action Checklist

Context pulled from: Google Calendar (attendees), HubSpot (company/deal history), Notion Projects (project page), Granola (prior meeting notes).

### Step 5 — Send Slack DMs
Individual DMs to each NTN attendee via Slack MCP (`slack_send_message`). Updates Notion Owner Notes with sent flags after each send.

### Step 6 — Silent if nothing to do
No Slack messages sent when there are no qualifying actions this run.

## Databases

| Database | Purpose | Notion ID |
|---|---|---|
| Prep Guides | One row per meeting prep guide | `74a287e66d934e118e772a07f2e175e7` |
| Projects | Matched via company name for relation tagging | `15456cd2373b82e2bca10190134ace79` |

## MCP Connections

| Service | Connector |
|---|---|
| Google Calendar | claude.ai Google Calendar MCP |
| Notion | claude.ai Notion MCP |
| HubSpot | claude.ai HubSpot MCP |
| Granola | claude.ai Granola MCP |
| Slack | claude.ai Slack MCP |

## Notes

- Pre-meeting window is 30–90 min — fires at the hourly run closest to 1 hour before start
- Morning window is 8–10am EST to account for hourly run timing
- If no prep guide exists when morning/pre-meeting window fires, those notifications are skipped
- Prep guide Status defaults to "Draft" — team can update to "Ready" after reviewing
