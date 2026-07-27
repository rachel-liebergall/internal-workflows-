# Expense Reminder

A simple scheduled reminder that sends every NTN team member a Slack DM twice a week to log outstanding expenses.

## What It Does

Runs every Monday and Friday at 9am EDT. On each run it:

1. Sends a brief Slack DM to all five team members (Rachel, Jess, Jason, Heather, Macrae) reminding them to check and submit any outstanding expenses

No conditions, no lookups — messages every team member every run.

## Schedule

- **Automatic:** Mondays and Fridays at 9am EDT

## Routine Configuration

| Field | Value |
| --- | --- |
| Routine ID | `trig_01AKbYasTyixCoF5paBhN1x4` |
| Model | claude-sonnet-4-6 |
| Schedule | `0 13 * * 1,5` (Mon & Fri at 13:00 UTC / 9am EDT) |
| MCP Connections | None |
| Slack Sender | Baxter (`$BAXTER_TOKEN`) |

## Recreating This Routine

1. Go to [claude.ai/code/routines](https://claude.ai/code/routines) and create a new routine
2. Set the schedule to `0 13 * * 1,5`
3. No MCP connectors needed — Slack is called via Baxter's bot token
4. Add `BAXTER_TOKEN` as an environment variable
5. Paste the prompt from `expense-reminder-baxter.md` as the agent instructions
