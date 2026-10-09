# Weekly Reflection (Baxter)

A two-routine system that collects weekly reflections from each team member via Slack DM every Friday, then synthesizes patterns and delivers a report to Rachel every Monday.

## What It Does

**Friday (Send) —** Baxter DMs every active team member five reflection questions at 3pm EDT. Team members can respond in the thread with text or a Slack voice message.

**Monday (Report) —** Baxter reads all DM threads from the weekend, synthesizes patterns across the team, emails Rachel a formatted report, and saves a row to the Weekly Reflection Reports Notion database.

The report surfaces:
- Shared patterns across team responses
- What's working and what to protect
- Friction and blockers
- Overlapping work / coordination opportunities
- AI opportunity signals (repeatable tasks AI could automate)
- New offering or client opportunity signals
- Individual highlights per respondent
- Non-responders and voice message flags

## Reflection Questions Sent

1. What took most of your time this week? Was it worth it?
2. Where did you feel real momentum?
3. Where did you feel stuck, spinning, or going in circles?
4. What pattern are you noticing — in your work, a client situation, or the team?
5. One thing you'd do differently next week.

## Notion Output

| Field | Detail |
|---|---|
| Database | Weekly Reflection Reports |
| Database ID | `0e48d819-6441-4313-ac04-629060baac1b` |
| Location | Operations › AI Management |
| New row per week | Yes — titled "Week of [Mon DD, YYYY]" |

## Schedule

- **Send:** Fridays at 3pm EDT (`0 19 * * 5`)
- **Report:** Mondays at 9am EDT (`0 13 * * 1`)

## Routine Configuration

### Send Routine

| Field | Value |
|---|---|
| Routine ID | `trig_0124LBy8pXoRyWj4EYyrF23p` |
| Schedule | `0 19 * * 5` (Friday 3pm EDT) |
| MCP Connections | None |
| Slack Sender | Baxter (`$BAXTER_TOKEN`) |

### Report Routine

| Field | Value |
|---|---|
| Routine ID | `trig_019yr7J99UuS2ycHsThq5r2b` |
| Schedule | `0 13 * * 1` (Monday 9am EDT) |
| MCP Connections | Gmail, Notion |
| Slack Reader | Baxter (`$BAXTER_TOKEN`) |
| Email recipient | rachel@nowtonext.ai |

## Recreating This System

**Send routine:**
1. Create a new routine at [claude.ai/code/routines](https://claude.ai/code/routines)
2. Set schedule to `0 19 * * 5`
3. No MCP connectors needed
4. Ensure `BAXTER_TOKEN` is set in the environment
5. Paste the prompt from `weekly-reflection-send-baxter.md`

**Report routine:**
1. Create a new routine
2. Set schedule to `0 13 * * 1`
3. Attach **Gmail** and **Notion** MCP connectors
4. Ensure `BAXTER_TOKEN` is set in the environment
5. Paste the prompt from `weekly-reflection-report-baxter.md`

## Related Files

- `weekly-reflection-send-baxter.md` — Friday send routine prompt
- `weekly-reflection-report-baxter.md` — Monday report routine prompt
