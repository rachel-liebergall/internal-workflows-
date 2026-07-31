# HubSpot Deal Creator — Scheduled Routine

## Overview

Automated routine that monitors Gmail for emails labeled `hubspot opp creation` and creates draft HubSpot deals for review. Runs 3x daily and sends a Slack DM with a link to each draft deal before it is activated. Also resolves/creates company and contact records, creates explicit associations, and backfills all existing Gmail-synced email history onto the deal.

## Schedule

| Run | Local (EDT) | UTC |
|-----|-------------|-----|
| Morning | 10:00 AM | 14:00 |
| Afternoon | 2:00 PM | 18:00 |
| Evening | 9:00 PM | 01:00 (next day) |

Cron: `0 1,14,18 * * 1-5` (weekdays only)

## Routine ID

`trig_01KdEriXD5DRgDhZ3tjmVxCe`

Manage at: https://claude.ai/code/routines/trig_01KdEriXD5DRgDhZ3tjmVxCe

## Trigger

Apply the Gmail label **`hubspot opp creation`** to any email representing a potential opportunity. The routine will pick it up on the next run.

Processed emails are automatically labeled **`hubspot opp creation/done`** so they are not reprocessed.

## Workflow

### Step 0 — Fetch HubSpot owners
Fetch all HubSpot owners and match Rachel, Jess, and Jason by first name. Store their HubSpot owner IDs.

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

### Step 3 — Resolve or create company and contact records

Before creating the deal, resolve HubSpot IDs for all records so the deal can be properly associated.

**3A — Company**
Search HubSpot for an existing company by name or domain. Use existing company_id if found, otherwise create a new company record and store the returned company_id.

**3B — Contacts**
For each external contact: search HubSpot by email. Use existing contact_id if found, otherwise create a new contact record. Ensure each contact is associated with the company.

### Step 4 — Create deal and associations

**4A — Create the deal**
Creates deal in the **Pending Review** pipeline at stage **Initial Meeting Scheduled** (if that pipeline exists), otherwise in the default pipeline with a `PENDING REVIEW` note.

Deal fields:
- Deal name: `[Company] — [Service Type]`
- Deal owner(s): Rachel always, plus Jess/Jason if present in thread
- Close date: 90 days from today (placeholder)
- Service type: Signal / Room / Build / General

**4B — Create explicit associations (REQUIRED)**
After creating the deal, explicitly create:
- Deal-to-company association (deal_id → company_id)
- Deal-to-contact association (deal_id → each contact_id)

Without this step, the deal will not appear on contact or company records in HubSpot.

**4C — Associate all existing email engagements with the deal (REQUIRED)**
HubSpot's Gmail integration logs emails to contact timelines but does NOT automatically link them to deals. For each contact:
1. Fetch all EMAIL engagements on that contact's timeline.
2. For each engagement not already associated with deal_id: create an engagement-to-deal association.
3. Process in batches of 10 (HubSpot API limit per call).

This ensures the full email history for these contacts is visible directly on the deal record.

**4D — Log the triggering email as a HubSpot engagement**
Create a new email engagement from the triggering Gmail email (subject, body, sender, recipients, timestamp) and associate it with deal_id, company_id, and all contact_ids.

### Step 5 — Send Slack DM

Sends a DM to Rachel (Slack user `U0ACE0F48F6`) with:
- Company, contacts, service type, stage, owners, meeting date
- Confidence level
- Any flags or ambiguities
- Direct link to the draft deal in HubSpot

### Step 6 — Mark email as processed

Applies `hubspot opp creation/done` label to the email.

## MCP Connections

| Service | Connector |
|---|---|
| Gmail | claude.ai Gmail MCP |
| Google Calendar | claude.ai Google Calendar MCP |
| HubSpot | claude.ai HubSpot MCP |
| Slack | claude.ai Slack MCP |

## Key behaviors

- **Never creates duplicate deals** — checks for existing open deals before creating
- **Always assigns Rachel as owner** — never leaves owner blank
- **Email engagement batching** — batches association calls in groups of 10 due to HubSpot API limit
- **Weekdays only** — cron excludes Saturday and Sunday
