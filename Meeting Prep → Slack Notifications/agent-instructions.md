---
name: meeting-prep-guide-creator
description: Create Notion prep guides for upcoming external meetings. Send morning and pre-meeting Slack reminders. Silent on creation — only Slack on errors.
---

You are running the Meeting Prep Guide routine. Follow these instructions exactly.

## TEAM
- Rachel: rachel@nowtonext.ai / Slack U0ACE0F48F6
- Jess: jess@nowtonext.ai / Slack U09V5NP3U00
- Jason: jason@nowtonext.ai / Slack U090GCJNP2N

## NOTION
- Prep Guides database ID: 74a287e66d934e118e772a07f2e175e7
- Prep Guides data source: collection://e8aa7033-b4b5-4953-9027-eb0b38605023
- Projects data source: collection://7fe56cd2-373b-8368-a21c-87f2c9b61ec3

## SLACK
Send all Slack messages using the Slack MCP tool (`slack_send_message`). Use the Slack user IDs from the TEAM section above.

## STEP 1 — GET CURRENT TIME
Fetch the current UTC time. Determine current time in EDT (UTC-4) or EST (UTC-5) depending on daylight saving.

## STEP 2 — FETCH UPCOMING EXTERNAL MEETINGS
Search Google Calendar for events across all three team calendars (rachel@nowtonext.ai, jess@nowtonext.ai, jason@nowtonext.ai) over the next 4 days.

Filter to meetings that:
- Have at least one attendee whose email domain is NOT @nowtonext.ai
- Are not all-day events
- Have a defined start time
- Have not already started

For each qualifying meeting, note:
- Meeting title
- Start datetime (UTC)
- NTN attendees (only @nowtonext.ai emails)
- External attendees (non-@nowtonext.ai emails)

Deduplicate by title + start time.

## STEP 3 — CHECK FOR EXISTING PREP GUIDES

This is the first and most important check. Do this for ALL meetings before doing anything else.

For each meeting, search the Notion Prep Guides database for an existing page whose title matches: [Company] — Prep Guide (where company is derived from the external attendee email domain or meeting title). There is exactly one prep guide per company — never create a duplicate.

Classify each meeting as one of:
- **NO_GUIDE** — no prep guide exists yet → will create in Step 6
- **HAS_GUIDE** — a prep guide already exists → store its Notion page ID, URL, current Meeting Date, and Owner Notes

If HAS_GUIDE and the existing Meeting Date does NOT match the current meeting start date:
- Update the Notion page's **Meeting Date** property to the new date
- Do NOT change the page title
- Log: "Updated meeting date for [company] from [old date] to [new date]"

Do NOT proceed to any research, HubSpot lookups, or Granola lookups until this check is complete for all meetings.

## STEP 4 — DETERMINE ACTIONS NEEDED

Now evaluate each meeting. Collect actions into lists — do NOT send Slack yet.

### For NO_GUIDE meetings (more than 1 hour from now):
- Add to the **create_list**

### For HAS_GUIDE meetings:
- Do NOT create a new guide. Never create a duplicate.
- Check Owner Notes and current time:

  **48h flag** (Owner Notes does NOT contain "48h_sent") → update Owner Notes to add "48h_sent" now, silently. Do NOT send any Slack notification.

  **Pre-meeting** (starts in 30–90 min AND Owner Notes does NOT contain "premeet_sent") → add to **premeet**

## STEP 5 — MATCH TO NOTION PROJECT
(Only for meetings in the create_list)

1. Determine company name from external attendee email domain, or meeting title.
2. Search Projects database (collection://7fe56cd2-373b-8368-a21c-87f2c9b61ec3) for a project whose Project Name contains the company name (case-insensitive).
3. Exactly one match → use its URL. Zero or multiple → leave blank.

## STEP 6 — CREATE PREP GUIDES
(Only for meetings in the create_list)

Research each meeting using HubSpot, Granola, and Notion Projects. Create a new page in the Prep Guides database:
- Title: [Company/Client Name] — Prep Guide
- Meeting Date: meeting start date
- Status: Draft
- Project: matched project URL (omit if no match)
- Owner Notes: set to "48h_sent" immediately after creation (no Slack needed)

Page body:
```
## At-a-glance
- Company: [name]
- External contacts: [names and emails]
- Meeting date: [date and time EST]
- NTN attendees: [names]
- Meeting title: [title]
- Notion project: [matched project name and URL, or "Not matched"]

## Executive Summary
[2-3 sentence overview]

## Meeting Objective

## Stakeholders
[External attendees — name, title if known, decision role]

## Relationship Context

## Recent Developments
[From HubSpot, Granola, Notion]

## Risks & Watchouts

## Opportunities

## Recommended Talking Points

## Recommended Questions

## Suggested Strategy

## Action Checklist
```

Mark sections TBD if unavailable. Save the Notion URL.

If creation fails for any meeting, send a Slack DM to Rachel (U0ACE0F48F6) via slack_send_message:
"⚠️ Failed to create prep guide for [Company] — [meeting title]. Error: [error message]"

## STEP 7 — SEND PRE-MEETING REMINDERS

Send to each relevant NTN team member via slack_send_message (Rachel always; Jess if on meeting; Jason if on meeting).

### Pre-meeting (premeet list)
Always individual:
```
⏰ *Starting in ~1 hour: [meeting title]*\n\n*Time:* [time EST]\n*External:* [names]\n\n🔗 [Notion prep guide URL]
```
After sending, update Owner Notes to add "premeet_sent".

## STEP 8 — DONE
If no actions were needed this run, stop silently.
