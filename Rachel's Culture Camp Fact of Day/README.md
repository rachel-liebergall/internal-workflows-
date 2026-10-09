# Rachel's Culture Camp Fact of Day (Baxter)

A daily Baxter routine that DMs Jason Averbook one surprising, high-energy pop culture fact every weekday morning at 8:30am EDT — appearing to come from Rachel, using her Slack profile photo as the icon.

## What It Does

Each weekday, Baxter:
1. Gets Rachel's current Slack profile photo (fetched live each run)
2. Picks today's category based on the day of the week
3. Generates one punchy, "wait WHAT?!" pop culture fact
4. DMs Jason via Baxter with Rachel's identity (custom `username` + `icon_url`)

The message format:
```
🎬 *Rachel's Culture Camp Fact of Day*

[2–4 sentence fact — lead with the wow]

_Camp is in session._ 🏕️
```

## Category Rotation

| Day | Category | Emoji |
|---|---|---|
| Monday | Movies | 🎬 |
| Tuesday | Music | 🎵 |
| Wednesday | TV Shows | 📺 |
| Thursday | Sports or Celebrity | 🏆 |
| Friday | Wildcard | 🥳 |

## Fact Style

The routine is calibrated for maximum "did you know" energy — not documentary narration. Examples of the right vibe:

- Celebrity decisions with surprising dollar figures
- Behind-the-scenes moments that changed pop culture forever
- Near-misses that would have altered history (different casting, rejected demos, etc.)
- Unexpected connections between famous people or projects
- Wild failures of things that seemed like sure bets

## Routine Configuration

| Field | Value |
|---|---|
| Routine ID | `trig_017hkGHsk1LVmV7crD7zaaWQ` |
| Schedule | `30 12 * * 1-5` (8:30am EDT weekdays) |
| MCP Connections | None |
| Slack Sender | Baxter (`$BAXTER_TOKEN`) with Rachel's avatar |
| Recipient | Jason Averbook (Slack ID: `U090GCJNP2N`) |
| Rachel's Slack ID | `U0ACE0F48F6` (avatar fetched dynamically each run) |

## Recreating This Routine

1. Go to [claude.ai/code/routines](https://claude.ai/code/routines) and create a new routine
2. Set the schedule to `30 12 * * 1-5`
3. No MCP connectors needed
4. Ensure `BAXTER_TOKEN` is set in the environment
5. Paste the prompt from `rachels-culture-camp-baxter.md`

## Related Files

- `rachels-culture-camp-baxter.md` — full routine prompt
