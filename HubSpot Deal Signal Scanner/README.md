# HubSpot Deal Signal Scanner

A scheduled Claude agent that scans the team-wide HubSpot account (every team member's logged email, plus calls, meetings and notes) and posts a deal signal summary to #sales-tracking twice a week.

## What It Does

Runs every Tuesday and Friday at 9am EDT. On each run it:

1. Collects the last 4 days of activity:
   - **HubSpot (primary, team-wide):** all logged emails for every owner (Rachel, Jess, Jason, Heather, Macrae, Patrick; every inbox is connected), plus calls, meetings and notes
   - **Google Calendar (supplement):** every team member's calendar (Rachel, Jess, Jason, Heather, Macrae, Welrose, Aidan, Liv, Patrick; read by passing `calendarId`), used only to find meetings with people who aren't in HubSpot yet
   - Gmail is not used, because the team's email is already in HubSpot
2. Applies five signal types:
   - **Signal A** — Activity with no open deal (potential new opportunity)
   - **Signal B** — Re-engagement after 30+ days of silence
   - **Signal C** — Multiple contacts from the same company active within 4 days
   - **Signal D** — Open deals with no activity in more than 7 days
   - **Signal E** — Team contacts who aren't in HubSpot yet
3. Posts a formatted summary to #sales-tracking
4. Posts "No signals to flag" if nothing is found

## Schedule

- **Automatic:** Tuesdays and Fridays at 9am EDT

## Routine Configuration

Two variants exist — one uses Baxter's bot token for Slack, the other uses the Slack MCP connector:

| Field | Baxter Variant | MCP Variant |
| --- | --- | --- |
| Routine ID | `trig_01R7F1ZuzaC2BbWtiGEcjgds` | `trig_01WjtkPzpX1wdxodNcdJHF1E` |
| Model | claude-sonnet-4-6 | claude-sonnet-4-6 |
| Schedule | `0 13 * * 2,5` | `0 13 * * 2,5` |
| MCP Connections | HubSpot, Google Calendar (Gmail attached, unused) | HubSpot, Slack |
| Slack Sender | Baxter (`$BAXTER_TOKEN`) | Slack MCP |
| Slack Channel | #sales-tracking (`C0BAJHSBHHB`) | #sales-tracking (`C0BAJHSBHHB`) |

## Recreating This Routine

1. Go to [claude.ai/code/routines](https://claude.ai/code/routines) and create a new routine
2. Set the schedule to `0 13 * * 2,5`
3. Attach the **HubSpot** and **Google Calendar** MCP connectors (Calendar signed in as Rachel; her account must keep read access to every team member's calendar)
   - Baxter variant: add `BAXTER_TOKEN` as an environment variable
   - MCP variant: also attach the **Slack** MCP connector
4. Paste the prompt from `hubspot-deal-signal-scanner-baxter.md` or `hubspot-deal-signal-scanner.md` as the agent instructions

## Change log

- Oct 26, 2026: Jess's and Jason's activity now included. Before, the scanner only read Rachel's Gmail and calendar. It now reads their calendars by explicit `calendarId` and their email from HubSpot-logged emails.
- Oct 26, 2026 (later): switched to a team-wide HubSpot scan. All logged email for every owner is read from HubSpot instead of Rachel's Gmail; calendars only supplement. Signal E now covers the whole team. Sections capped at 10 items.
- Oct 28, 2026: calendar supplement expanded from 4 calendars to all 9 team members (Heather, Welrose, Aidan, Liv and Patrick added). Access was verified for all of them except Liv, whose check hit a temporary Google quota limit; Liv was readable earlier the same week. The scanner retries once on quota errors. Also fixed: the Oct 27 run skipped calendars entirely, because it never loaded the deferred Calendar tools. Step 4 is now marked required, and the run can't post until every calendar has been attempted.
