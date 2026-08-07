# Substack IP Scanner

A weekly Friday routine that scans Jason Averbook's and Jess Von Bank's Substack publications, extracts action items and offering opportunities from new posts, and adds them to the Notion Knowledge Library.

## What It Does

Runs every Friday at 9am EDT. On each run it:

1. Fetches RSS feeds from all three Substack publications (Jason × 2, Jess × 1)
2. Attempts best-effort LinkedIn scraping (skips silently if blocked)
3. Filters to posts published in the last 7 days
4. Checks the Notion database to skip posts already processed
5. Fetches and analyzes each new post for high-signal NTN-relevant items
6. Creates entries in the **Substack Action Items & Takeaways** database with all properties filled
7. Sends Rachel a Slack DM summarizing what was added

## What Gets Extracted

Each entry is classified by type and opportunity size:

| Type | Description |
| --- | --- |
| New IP/Offering | Named frameworks, methodologies, original concepts |
| Positioning/GTM | Market narratives, positioning angles, GTM ideas |
| Ops Signal | Operational signals or process improvements |
| Content Asset | Reusable assets (templates, checklists, prompts) |
| Tracking Note | Context worth preserving but not immediately actionable |

Only high-signal, NTN-actionable items are added — the routine is designed to avoid noise.

## Sources

| Author | Publication | RSS Feed |
| --- | --- | --- |
| Jason Averbook | jasonaverbook.substack.com | https://jasonaverbook.substack.com/feed |
| Jason Averbook | nowofwork.substack.com (secondary) | https://nowofwork.substack.com/feed |
| Jess Von Bank | jessvonbank.substack.com | https://jessvonbank.substack.com/feed |
| Both | LinkedIn (best-effort) | — |

## Notion Database

**Substack Action Items & Takeaways** — `15f21bdac867475cb7968ca621cd34b3`
Inside: **Knowledge Library** → Operations

| Property | Type | Values |
| --- | --- | --- |
| Item | Title | Short name for the item |
| Author | Select | Jason, Jess |
| Summary | Text | Why it matters to NTN |
| Post | Text | Source post title |
| Post Date | Date | Publication date |
| Source Link | URL | Direct post URL |
| Status | Status | Not started, In progress, Done |
| Type | Select | New IP/Offering, Positioning/GTM, Ops Signal, Content Asset, Tracking Note |
| Next Step | Text | Suggested next action |
| Offering Opportunity | Text | Specific product/service opportunity |
| Opportunity Size | Select | High, Medium, Low, None - Reinforces Existing |

## Schedule

- **Automatic:** Fridays at 9am EDT

## Routine Configuration

| Field | Value |
| --- | --- |
| Routine ID | `trig_01CddU5wkz68ZdDcxQTFqBZn` |
| Model | claude-sonnet-4-6 |
| Schedule | `0 13 * * 5` (9am EDT Fridays) |
| MCP Connections | Notion, Slack |
| Knowledge Library | `3b556cd2-373b-81dd-b657-d4355461b74f` |

## Recreating This Routine

1. Go to [claude.ai/code/routines](https://claude.ai/code/routines) and create a new routine
2. Set the schedule to `0 13 * * 5`
3. Attach **Notion** and **Slack** MCP connectors
4. Paste the prompt from `substack-ip-scanner.md` as the agent instructions
