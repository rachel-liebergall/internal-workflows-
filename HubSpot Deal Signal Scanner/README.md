# HubSpot Deal Signal Scanner

A scheduled Claude agent that scans HubSpot, email and calendar activity for Rachel, Jess and Jason and posts a deal signal summary to #sales-tracking twice a week.

## What It Does

Runs every Tuesday and Friday at 9am EDT. On each run it:

1. Collects the last 4 days of activity:
   - **Rachel:** Gmail and Google Calendar (the connectors are signed in as Rachel)
   - **Jess and Jason:** their Google Calendars (read by passing `calendarId` explicitly) and their emails as logged in HubSpot (their inboxes are connected to HubSpot; the Gmail connector cannot read other people's inboxes)
   - **Everyone:** HubSpot calls, meetings and notes
2. Applies five signal types:
   - **Signal A** — Activity with no open deal (potential new opportunity)
   - **Signal B** — Re-engagement after 30+ days of silence
   - **Signal C** — Multiple contacts from the same company active within 4 days
   - **Signal D** — Open deals with no activity in more than 7 days
   - **Signal E** — Jess/Jason contacts who aren't in HubSpot yet
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
| MCP Connections | HubSpot, Gmail, Google Calendar | HubSpot, Slack |
| Slack Sender | Baxter (`$BAXTER_TOKEN`) | Slack MCP |
| Slack Channel | #sales-tracking (`C0BAJHSBHHB`) | #sales-tracking (`C0BAJHSBHHB`) |

## Recreating This Routine

1. Go to [claude.ai/code/routines](https://claude.ai/code/routines) and create a new routine
2. Set the schedule to `0 13 * * 2,5`
3. Attach the **HubSpot**, **Gmail** and **Google Calendar** MCP connectors (signed in as Rachel; her account must keep read access to Jess's and Jason's calendars)
   - Baxter variant: add `BAXTER_TOKEN` as an environment variable
   - MCP variant: also attach the **Slack** MCP connector
4. Paste the prompt from `hubspot-deal-signal-scanner-baxter.md` or `hubspot-deal-signal-scanner.md` as the agent instructions

## Change log

- Oct 26, 2026: Jess's and Jason's activity now included. Before, the scanner only read Rachel's Gmail and calendar. It now reads their calendars by explicit `calendarId` and their email from HubSpot-logged emails.
