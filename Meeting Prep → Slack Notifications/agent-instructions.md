---
name: meeting-prep-guide-creator
description: Create Notion prep guides for upcoming external meetings and send Slack DMs 48h before, morning of, and 30 min before
---

You are running the Meeting Prep Guide routine. Follow these instructions exactly.

## TEAM
- Rachel: rachel@nowtonext.ai / Slack U0ACE0F48F6
- Jess: jess@nowtonext.ai / Slack U09V5NP3U00
- Jason: jason@nowtonext.ai / Slack U090GCJNP2N

## SLACK BOT TOKEN
<SLACK_BOT_TOKEN>

## NOTION
- Prep Guides database ID: 74a287e66d934e118e772a07f2e175e7
- Prep Guides data source: collection://e8aa7033-b4b5-4953-9027-eb0b38605023
- Projects data source: collection://7fe56cd2-373b-8368-a21c-87f2c9b61ec3

## STEP 1 — GET CURRENT TIME
Fetch the current UTC time. Determine current time in EDT (UTC-4) or EST (UTC-5) depending on daylight saving. Today's window checks will all be relative to this.

## STEP 2 — FETCH UPCOMING EXTERNAL MEETINGS
Search Google Calendar for events across all three team calendars (rachel@nowtonext.ai, jess@nowtonext.ai, jason@nowtonext.ai) over the next 4 days.

Filter to meetings that:
- Have at least one attendee whose email domain is NOT @nowtonext.ai
- Are not all-day events
- Have a defined start time

For each qualifying meeting, note:
- Meeting title
- Start datetime (UTC)
- Attendees (all emails)
- NTN attendees (only @nowtonext.ai emails)
- External attendees (non-@nowtonext.ai emails)
- Calendar it appeared on

Deduplicate meetings that appear on multiple team calendars (same title + start time = same meeting).

## STEP 3 — FOR EACH MEETING, DETERMINE WHAT ACTION IS NEEDED

For each meeting, calculate hours until start from current time. Then check these three windows:

### Window A — 48h prep (fires once between 47–49 hours before start)
Check Notion Prep Guides database for an existing page where Meeting Date matches this meeting's date AND Prep Guide title contains the company/client name.
If NO existing prep guide: create one (see Step 4).
If one already exists: skip creation. Check Owner Notes — if it does NOT contain "48h_sent", send the 48h Slack and update Owner Notes.

### Window B — Morning of (fires between 8:00–10:00 AM EST on the meeting day)
Applies if: it is the meeting day AND current time is between 8:00–10:00 AM EST.
Find the existing prep guide in Notion for this meeting.
If found AND Owner Notes does NOT contain "morning_sent": tentatively queue a morning send.

### Window C — Pre-meeting (fires when meeting starts in 30–90 minutes)
Applies if: meeting starts in 30–90 minutes from now.
Find the existing prep guide in Notion for this meeting.
If found AND Owner Notes does NOT contain "premeet_sent": tentatively queue a pre-meeting send.

### COLLISION RULE — If both Window B and Window C apply to the same meeting in the same run:
- Send ONLY the pre-meeting message (Window C). Do NOT send the morning message.
- Mark BOTH "morning_sent" and "premeet_sent" in Owner Notes.
- This prevents duplicate Slack messages when a meeting starts during the morning window (e.g. a 9am meeting).

If only Window B applies: send morning message, mark "morning_sent".
If only Window C applies: send pre-meeting message, mark "premeet_sent".

## STEP 4 — MATCH TO NOTION PROJECT

Before creating the prep guide, attempt to find a matching project in the Notion Projects database.

1. Determine the company name from: HubSpot company lookup using external attendee email domain, or the meeting title, or the external attendee email domain itself (e.g. "acme.com" → "Acme").

2. Search the Projects database (collection://7fe56cd2-373b-8368-a21c-87f2c9b61ec3) for a project whose `Project Name` contains the company name (case-insensitive).

3. Matching rules:
   - If exactly one project matches: use its page URL as the `Project` relation value
   - If zero matches: leave `Project` blank
   - If multiple matches: leave `Project` blank (conservative — do not guess)

Store the matched project page URL (or null) for use in Step 5.

## STEP 5 — CREATE PREP GUIDE IN NOTION

Create a new page in the Prep Guides database with:
- Title: [Company/Client Name] — Prep Guide ([Meeting Date as MM/DD/YYYY])
- Meeting Date: meeting start date
- Status: Draft
- Project: matched project page URL from Step 4 (omit if no match)
- Owner Notes: 48h_sent (add this after sending the Slack)

For the page body, generate a full meeting prep brief using the client-meeting-preparation skill logic:

Research and populate these sections using context from Google Calendar (attendees, meeting title), HubSpot (company/contact records, deal history), Notion Projects database (project page if one exists), and any prior Granola meeting notes for the same company:

```
## At-a-glance
- Company: [name]
- External contacts: [names and emails]
- Meeting date: [date]
- NTN attendees: [names]
- Meeting title: [title]

## Executive Summary
[2-3 sentence overview of who this is, where the relationship stands, and what this meeting is about]

## Meeting Objective
[What is the goal of this meeting?]

## Stakeholders
[External attendees — name, title if known, role in decision]

## Relationship Context
[History with this company — how long, what stage, prior conversations]

## Recent Developments
[Anything notable from recent emails, meetings, or CRM notes]

## Risks & Watchouts
[Potential concerns, sensitivities, or things to be careful about]

## Opportunities
[What could come out of this meeting if it goes well]

## Recommended Talking Points
[3-5 specific talking points relevant to this meeting]

## Recommended Questions
[3-5 smart discovery or strategic questions]

## Suggested Strategy
[Overall approach recommendation for this meeting]

## Action Checklist
[Things to do before the meeting]
```

If context is limited, populate what you can and mark sections TBD with a note on what info would help.

After creating the page, save the Notion URL.

## STEP 6 — SEND SLACK DMs

Send individual Slack DMs to each NTN attendee on the meeting using the bot token:

```
curl -s -X POST https://slack.com/api/chat.postMessage \
  -H "Authorization: Bearer <SLACK_BOT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"channel": "<SLACK_USER_ID>", "text": "<MESSAGE>"}'
```

Determine which NTN team members to DM:
- Always include Rachel (U0ACE0F48F6)
- Include Jess (U09V5NP3U00) if jess@nowtonext.ai is in the meeting attendees
- Include Jason (U090GCJNP2N) if jason@nowtonext.ai is in the meeting attendees

### 48h message:
'📋 *Meeting Prep Ready — 48h Out*\n\n*Meeting:* [title]\n*Date:* [date and time EST]\n*External:* [external attendee names and emails]\n*NTN Team:* [NTN attendee names]\n\nPrep guide created in Notion:\n🔗 [Notion URL]\n\n_Review and update before the call._'

### Morning of message:
'☀️ *Meeting Today — Prep Reminder*\n\n*Meeting:* [title]\n*Time:* [time EST]\n*External:* [external attendee names and emails]\n\n🔗 [Notion prep guide URL]'

### Pre-meeting message:
'⏰ *Starting in ~30 min: [meeting title]*\n\n*Time:* [time EST]\n*External:* [external attendee names]\n\n🔗 [Notion prep guide URL]'

After sending each Slack batch, update the Notion prep guide Owner Notes to append the relevant flag (morning_sent or premeet_sent), preserving any existing flags.

## STEP 7 — DONE
If no actions were needed this run, stop silently. Do not send any Slack messages when there is nothing to do.
