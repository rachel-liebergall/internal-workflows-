# HubSpot Deal Creator — Scheduled Routine

## Overview

Automated routine that monitors Gmail for emails labeled `hubspot opp creation` and creates draft HubSpot deals for review. Runs 3x daily and sends a Slack DM with a link to each draft deal before it is activated.

## Schedule

| Run | Local (EDT) | UTC |
|-----|-------------|-----|
| Morning | 10:00 AM | 14:00 |
| Afternoon | 2:00 PM | 18:00 |
| Evening | 9:00 PM | 01:00 (next day) |

Cron: `0 1,14,18 * * *`

> Note: Schedule is set to EDT (UTC-4). Adjust by 1 hour in winter when clocks change to EST (UTC-5).

## Routine ID

`trig_01KdEriXD5DRgDhZ3tjmVxCe`

Manage at: https://claude.ai/code/routines/trig_01KdEriXD5DRgDhZ3tjmVxCe

## Trigger

Apply the Gmail label **`hubspot opp creation`** to any email representing a potential opportunity. The routine will pick it up on the next run.

Processed emails are automatically labeled **`hubspot opp creation/done`** so they are not reprocessed.

## Workflow

### Step 1 — Find emails
Search Gmail: `label:"hubspot opp creation" -label:"hubspot opp creation/done"`

If no emails found, stop. No Slack message sent.

### Step 2 — For each email, run deal creation logic

**Identify Meeting**
Check Google Calendar for Rachel, Jess, and Jason's calendars for associated meetings with external attendees matching the email domain.

**Validate existing CRM records**
Search HubSpot for existing companies, contacts, and open deals. If a relevant open deal already exists, skip creation and flag in Slack.

**Determine Company**
Identify from email domain, signatures, meeting invites, and web context. Skip if company cannot be identified.

**Determine Contacts**
All external participants. Excludes @nowtonext.ai addresses.

**Determine Service Type**
- Signal
- Room
- Build
- General (default if uncertain)

**Determine Opportunity Owners**
- Rachel (rachel@nowtonext.ai) — always included
- Jess — if present in meeting or email thread
- Jason — if present in meeting or email thread

**Determine Deal Stage**

| Signal | Stage |
|---|---|
| First external meeting scheduled | Initial Meeting Scheduled |
| Multiple exploratory conversations | Discovery / Qualification |
| Clear problem defined | Qualified Opportunity |
| Proposal or scope discussion | Proposal / Solutioning |
| Active commercial discussion | Negotiation |
| Existing client expansion | Expansion Opportunity |
| Returning relationship | Existing Relationship Opportunity |

Default: **Initial Meeting Scheduled**

**Confidence Assessment**
- High: company clear, contacts validated, no duplicate risk
- Medium: some ambiguity but deal creation is reasonable
- Low: company ambiguous, duplicate risk, or participants unclear

Low confidence + ambiguous company or high duplicate risk → skip deal creation, notify via Slack.

### Step 3 — Create draft deal in HubSpot

Creates deal in the **Pending Review** pipeline at stage **Initial Meeting Scheduled**.

If no Pending Review pipeline exists, creates in the default pipeline with a note: `PENDING REVIEW — created by automated routine, awaiting approval before activation`.

Deal fields populated:
- Deal name: `[Company] — [Service Type] — [Date]`
- Associated company
- Associated contacts
- Deal owner(s)
- Initial meeting date
- Service type

### Step 4 — Send Slack DM

Sends a DM to Rachel (Slack user `U0ACE0F48F6`) with:
- Company, contacts, service type, stage, owners, meeting date
- Confidence level
- Any flags or ambiguities
- Direct link to the draft deal in HubSpot

### Step 5 — Mark email as processed

Applies `hubspot opp creation/done` label to the email.

## MCP Connections

| Service | Connector |
|---|---|
| Gmail | claude.ai Gmail MCP |
| Google Calendar | claude.ai Google Calendar MCP |
| HubSpot | claude.ai HubSpot MCP |
| Slack | claude.ai Slack MCP |

## Related

- HubSpot Opp Creator skill: `hubspot-opp-creator` (local Claude Code skill)
- HubSpot Pending Review pipeline — must exist in HubSpot for draft deals to land correctly
