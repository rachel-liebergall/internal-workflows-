# Daily Task Roundup

A scheduled Claude Code routine that sends each NTN team member one personalized morning Slack message per day combining their upcoming tasks and any external meetings.

## Schedule

Daily at 9am EDT (1pm UTC) — `0 13 * * *`

> Note: Update to `0 14 * * *` in November when clocks fall back to EST.

## What It Does

For each team member (Rachel, Jess, Jason):
1. Queries Notion Tasks for tasks assigned to them due within 7 days (not Done/Cancelled)
2. Checks Google Calendar for external meetings today
3. Looks up matching Notion prep guides for each meeting
4. Sends one combined Slack DM — tasks + meetings in a single message
5. Skips silently if nothing to report

## Message Formats

| Scenario | Message |
|---|---|
| Tasks + meetings | Combined "Good morning — Here's your day" |
| Meetings only | Meeting list + "No tasks due this week ✓" |
| Tasks only | Task list + "No external meetings today" |
| Neither | Silent — no message sent |

## Routine Details

| Field | Value |
|---|---|
| Routine ID | `trig_01Js9g7zXcdeWEpidKkWJB8r` |
| Routines page | https://claude.ai/code/routines/trig_01Js9g7zXcdeWEpidKkWJB8r |
| MCP Connections | Notion, Google Calendar |

## Key IDs

| Resource | ID |
|---|---|
| Tasks (Notion DB) | `36e56cd2373b8325939281a80a6cb5d9` |
| Prep Guides (Notion DB) | `74a287e66d934e118e772a07f2e175e7` |

## Related Routines

- **meeting-prep-guide-creator** — creates prep guides and sends pre-meeting reminders (30–90 min before). The morning message was removed from that routine — this routine handles all morning communication.
