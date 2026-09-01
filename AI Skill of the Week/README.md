# AI Skill of the Week

A four-routine weekly workflow that auto-selects a skill from the Notion Skills database, announces it to the full team on Monday, follows up midweek, and closes it out Friday — fully automated after Rachel's Monday morning approval.

## What It Does

Four routines fire across the week:

| Routine | When | What it does |
| --- | --- | --- |
| `skill-of-week-monday-prep` | Mon 9am EDT | Selects next unused skill → drafts content → DMs Rachel for review → marks Queued |
| `skill-of-week-monday-announce` | Mon 11am EDT | Posts announcement to #all-now-to-next → saves thread ts → marks Active |
| `skill-of-week-wednesday-followup` | Wed 11am EDT | Posts midweek follow-up in thread with 3 tailored reflection questions |
| `skill-of-week-friday-closeout` | Fri 4pm EDT | Marks skill as Used in Notion → DMs Rachel confirmation |

## Workflow State Machine

Skill statuses flow through the Notion Skills database `Week Status` property:

```
(empty) → Queued → Active → Used
                          ↗
                      Skip (manually set to skip a skill)
```

## Notion Skills Database

- **Data source:** `collection://35e56cd2-373b-8001-975c-000b09a4ea96`

| Property | Type | Purpose |
| --- | --- | --- |
| Week Status | Select | Queued / Active / Used / Skip |
| Skill Week Date | Date | Monday of the week the skill ran |
| Slack Thread TS | Rich Text | Thread timestamp for the #all-now-to-next announcement |

## Slack

- **Announcement channel:** `#all-now-to-next` (`C090GCJV40J`)
- **Rachel DM:** Slack user ID `U0ACE0F48F6`

## Routine Configuration

| Routine | ID | Cron | MCP |
| --- | --- | --- | --- |
| skill-of-week-monday-prep | `trig_01WZEUsy6dnMR5Ff91B1it17` | `0 13 * * 1` | Notion, Slack |
| skill-of-week-monday-announce | `trig_012n2YHvYjKjtwAEpRhZqzkJ` | `0 15 * * 1` | Notion, Slack |
| skill-of-week-wednesday-followup | `trig_01JJQUiXyL7QBs57C2jTa2fr` | `0 15 * * 3` | Notion, Slack |
| skill-of-week-friday-closeout | `trig_01VnpdKBL9ZLujnjEMXvY9nj` | `0 20 * * 5` | Notion, Slack |

## Recreating These Routines

1. Go to [claude.ai/code/routines](https://claude.ai/code/routines) and create a new routine
2. Set the schedule and MCP connections per the table above
3. Paste the prompt from the corresponding `.md` file in this directory
