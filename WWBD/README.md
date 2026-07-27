# WWBD (What Would Baxter Do?)

A test-week routine that sends Rachel one personalized daily tip from Baxter at 2pm EST — synthesizing Jason's daily news with Rachel's current tasks into a specific, actionable insight.

## What It Does

**Daily Tip (Weekdays at 2pm EST, Jul 28–Aug 1 test week):**

1. Pulls Jason's daily news entries from the last 5 days (Team Context & Daily News database)
2. Queries Rachel's active and overdue Notion tasks for the current week
3. Synthesizes both into one specific, actionable tip that connects the external news context to something Rachel is actually working on
4. Sends as a Slack DM from Baxter in the format: `🤖 *What Would Baxter Do?*`

**Test Week Complete (One-time, Aug 4 at 9am EDT):**

Sends Rachel a Slack DM notifying her that the test week is done and asking whether to roll out the tip to the full team.

## Notes

- This is a test-week run for Rachel only — full team rollout pending approval after Aug 1
- The tip is intentionally never generic: it connects an external signal to something Rachel is actually working on right now
- If no clear connection exists, Baxter leads with a sharp observation from her task list instead

## Notion Databases

| Database | ID | Used For |
| --- | --- | --- |
| Tasks | `36e56cd2373b8325939281a80a6cb5d9` | Rachel's current work |
| Team Context & Daily News | `0369f0d1d72341159cec834312bc5fdb` | External signals and news |

## Schedule

| Routine | Schedule |
| --- | --- |
| Daily Tip | Weekdays at 2pm EST (Jul 28–Aug 1 only) |
| Test Week Complete | One-time: Aug 4, 2026 at 9am EDT |

## Routine Configuration

| Field | Daily Tip | Test Week Complete |
| --- | --- | --- |
| Routine ID | `trig_01X8T8pQSDxtb9ueXQwbxT1T` | `trig_012Wvc2vmDfYzALEabLrVsp6` |
| Model | claude-sonnet-4-6 | claude-sonnet-4-6 |
| Schedule | `0 19 * * 1-5` (2pm EST) | `0 13 4 8 *` (Aug 4, 9am EDT) |
| MCP Connections | Notion, Google Calendar | None |
| Slack Sender | Baxter (`$BAXTER_TOKEN`) | Baxter (`$BAXTER_TOKEN`) |

## Recreating This Routine

To recreate the daily tip for a full-team rollout:

1. Go to [claude.ai/code/routines](https://claude.ai/code/routines) and create a new routine
2. Update the TEAM section in the prompt to include all five team members
3. Set the schedule to `0 19 * * 1-5`
4. Attach **Notion** and **Google Calendar** MCP connectors
5. Add `BAXTER_TOKEN` as an environment variable
6. Paste the updated prompt as the agent instructions
