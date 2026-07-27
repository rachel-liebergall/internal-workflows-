# HubSpot Deal Signal Scanner

A scheduled Claude agent that scans HubSpot activity across the full team and posts a deal signal summary to #sales-tracking twice a week.

## What It Does

Runs every Tuesday and Friday at 9am EDT. On each run it:

1. Scans all HubSpot activity (emails, calls, meetings, notes) from the last 4 days across all NTN team members
2. Applies four signal types:
   - **Signal A** — Activity with no open deal (potential new opportunity)
   - **Signal B** — Re-engagement after 30+ days of silence
   - **Signal C** — Multiple contacts from the same company active within 4 days
   - **Signal D** — Open deals with no activity in more than 7 days
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
| MCP Connections | HubSpot | HubSpot, Slack |
| Slack Sender | Baxter (`$BAXTER_TOKEN`) | Slack MCP |
| Slack Channel | #sales-tracking (`C0BAJHSBHHB`) | #sales-tracking (`C0BAJHSBHHB`) |

## Recreating This Routine

1. Go to [claude.ai/code/routines](https://claude.ai/code/routines) and create a new routine
2. Set the schedule to `0 13 * * 2,5`
3. Attach the **HubSpot** MCP connector
   - Baxter variant: add `BAXTER_TOKEN` as an environment variable
   - MCP variant: also attach the **Slack** MCP connector
4. Paste the prompt from `hubspot-deal-signal-scanner-baxter.md` or `hubspot-deal-signal-scanner.md` as the agent instructions
