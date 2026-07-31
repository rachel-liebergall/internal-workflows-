# HubSpot Deal Creator (Baxter)

A scheduled Claude agent that monitors Gmail for prospecting emails, creates HubSpot deals with full CRM associations, and DMs Rachel a deal summary via Baxter.

## What It Does

Runs three times daily (9pm, 10am, 2pm EDT on weekdays). On each run it:

1. Calls `tool_guidance` to learn the correct HubSpot association methods for this run
2. Fetches all HubSpot owner IDs (Rachel, Jess, Jason)
3. Searches Gmail for emails labeled `hubspot opp creation` that haven't been marked `done`
4. If the email is sparse on contacts or company, scans `#sales-tracking` for recent deal scanner posts about the same company to supplement context
5. For each email: identifies the company, external contacts, service type, deal stage, and opportunity owners
6. Resolves or creates the company and contact records in HubSpot
7. Creates the deal and immediately associates it with the company and all contacts
8. Fetches all existing email engagements for each contact and associates them with the deal (in batches of 10)
9. Logs the triggering email as a HubSpot engagement on the deal
10. DMs Rachel via Baxter with a deal summary and link
11. Applies the `hubspot opp creation/done` Gmail label to the processed email

If an open deal for the same organization already exists, it skips creation and alerts Rachel instead.

## Deal Fields Set on Creation

| Field | Value |
|---|---|
| Deal Name | `[Company] — [Service Type]` |
| Pipeline | Pending Review (if exists), else default |
| Deal Stage | Inferred from signals (default: Initial Meeting Scheduled) |
| Service Type | Signal / Room / Build / General |
| Owners | Rachel always; Jess and/or Jason if present in email/meeting |
| Close Date | 90 days from today |

## Service Type Classification

| Type | When Used |
|---|---|
| Signal | Research, thought leadership, analyst relations |
| Room | Events, roundtables, convenings |
| Build | Product, technology, delivery engagements |
| General | Default when unclear |

## #sales-tracking Fallback (Step 1B)

If the triggering email lacks clear contacts or company identification, the routine reads recent messages from `#sales-tracking` (Baxter's deal scanner output) and extracts contact names, job titles, and companies from Signal A and B sections. This prevents sparse briefs from creating unlinked deals.

## Schedule

- **Automatic:** Weekdays at 9pm, 10am, and 2pm EDT

## Routine Configuration

| Field | Value |
|---|---|
| Routine ID | `trig_01VZEG4ZfK7YvEuLxuZwY1HU` |
| Model | claude-sonnet-4-6 |
| Schedule | `0 1,14,18 * * 1-5` (9pm, 10am, 2pm EDT weekdays) |
| MCP Connections | Gmail, Google Calendar, HubSpot |
| Slack Sender | Baxter (`$BAXTER_TOKEN`) |
| Gmail Label (trigger) | `hubspot opp creation` |
| Gmail Label (done) | `hubspot opp creation/done` |

## Recreating This Routine

1. Go to [claude.ai/code/routines](https://claude.ai/code/routines) and create a new routine
2. Set the schedule to `0 1,14,18 * * 1-5`
3. Attach **Gmail**, **Google Calendar**, and **HubSpot** MCP connectors
4. Ensure `BAXTER_TOKEN` is set in the environment
5. Paste the prompt from `hubspot-deal-creator-routine-baxter.md` as the agent instructions

## Related Files

- `hubspot-deal-creator-routine-baxter.md` — agent prompt (Baxter/curl variant)
- `hubspot-deal-creator-routine.md` — agent prompt (Slack MCP variant)
- `hubspot-custom-code.js` — legacy HubSpot workflow custom code action (Notion sync, not a Claude routine)
- `agent-instructions.md` — legacy setup notes
