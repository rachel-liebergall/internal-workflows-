# Daily News → Notion Sync

A scheduled Claude agent that captures links from Slack and saves them to the **Team Context & Daily News** Notion database for team reference and use-case building.

## What It Does

Runs daily at 4pm ET. On each run it:

1. Reads all messages from **#daily-news** posted that day and saves any links to Notion
2. Searches Slack for any messages containing `daily-news-agent` posted that day, reads the link from that message or its parent thread, and saves it to Notion as a flagged link
3. Skips any URL already in the database (deduplication)
4. Only captures links from the current run date — no overlap with previous runs

## Notion Database

**Team Context & Daily News** — lives inside the NTN Project Manager page.

| Property | Type | Description |
| --- | --- | --- |
| Title | Title | Short description of the link |
| URL | URL | The link |
| Source | Select | `daily-news` or `Flagged Link` |
| Shared By | Text | Slack username of whoever shared it |
| Date | Date | Date the message was posted |
| Notes | Text | Message context |

## How To Flag a Link

To capture any link shared in Slack — whether in a channel, DM, or group message:

1. Reply to the message in the thread with: `daily-news-agent`
2. Or include `daily-news-agent` in the same message as the link

The agent reads thread context, so a reply on a thread is enough — you do not need to copy the link.

## Schedule

- **Automatic:** Daily at 4pm ET
- **Manual:** Go to [claude.ai/code/routines](https://claude.ai/code/routines) and hit "Run now" on `daily-news-agent` — useful when you flag a link and don't want to wait for the daily run

## Routine Configuration

| Field | Value |
| --- | --- |
| Routine ID | `trig_011KFkXYWaez2MTrSeBV4X1a` |
| Model | claude-sonnet-4-6 |
| Schedule | `0 20 * * *` (daily at 20:00 UTC / 4pm ET) |
| MCP Connections | Slack, Notion |
| Slack Channel | #daily-news (`C0AJ4JS599S`) |
| Notion DB ID | `0369f0d1d72341159cec834312bc5fdb` |

## Recreating This Routine

If you need to recreate this routine from scratch:

1. Go to [claude.ai/code/routines](https://claude.ai/code/routines) and create a new routine
2. Set the schedule to `0 20 * * *`
3. Attach the **Slack** and **Notion** MCP connectors
4. Paste the prompt from `prompt.md` as the agent instructions
