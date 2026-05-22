---
name: hubspot-deal-creator
description: Create draft HubSpot deals from Gmail emails labeled 'hubspot opp creation'
---

You are running the HubSpot Deal Creator routine. Follow these instructions exactly.

## TEAM MEMBERS
- Rachel: rachel@nowtonext.ai — always an opportunity owner
- Jess: jess@nowtonext.ai — add as owner if present in meeting or email thread
- Jason: jason@nowtonext.ai — add as owner if present in meeting or email thread

## STEP 0 — FETCH HUBSPOT OWNERS

Before processing any emails, fetch the full list of HubSpot owners. There are exactly three: Rachel, Jess, and Jason. Match them by first name (Rachel, Jess, Jason) and store their HubSpot owner IDs for use when creating deals. If the fetch fails, proceed anyway and attempt to assign owners by name when creating the deal.

## STEP 1 — FIND EMAILS TO PROCESS

Search Gmail for emails with the label 'hubspot opp creation' that do NOT have the label 'hubspot opp creation/done'. Use a search query like: `label:"hubspot opp creation" -label:"hubspot opp creation/done"`

If no emails are found, stop here. Do not send a Slack message.

## STEP 2 — FOR EACH EMAIL, RUN THE DEAL CREATION WORKFLOW

For each matching email, execute the following workflow in full:

### IDENTIFY MEETING
Check Google Calendar for any associated meetings. Only look at calendars belonging to Rachel (rachel@nowtonext.ai), Jess (jess@nowtonext.ai), and Jason (jason@nowtonext.ai).

Look for meetings with external attendees that match the email sender's domain or participants. Prefer the earliest relevant meeting with external attendees.

### VALIDATE EXISTING CRM RECORDS
Before creating anything, search HubSpot for:
- Existing companies matching the sender's domain
- Existing contacts matching the email participants
- Existing open deals for the same organization
- Historical relationship activity

If an existing relevant open deal already exists: do NOT create a new one. Instead, note this in the Slack DM and recommend updating the existing deal.

### DETERMINE COMPANY
Identify the correct company using attendee email domains, email signatures, meeting invites, and web context. If company cannot be reasonably identified: skip deal creation, send a Slack DM explaining this, label the email 'hubspot opp creation/done', and move to the next email.

### DETERMINE CONTACTS
Identify all relevant external contacts from meeting attendees and email participants. Do not include @nowtonext.ai addresses.

### DETERMINE SERVICE TYPE
Classify as one of: Signal, Room, Build, General. Default to General if uncertain.

### DETERMINE OPPORTUNITY OWNERS
Using the owner IDs fetched in Step 0:
- Rachel MUST always be included
- Add Jess if jess@nowtonext.ai appears anywhere in the email thread or meeting attendees
- Add Jason if jason@nowtonext.ai appears anywhere in the email thread or meeting attendees
- NEVER leave owner blank. Always assign Rachel at minimum.

### DETERMINE DEAL STAGE
Default to: **Initial Meeting Scheduled**

But infer a more appropriate stage if signals are clear:

| Signal | Stage |
|---|---|
| First external meeting scheduled | Initial Meeting Scheduled |
| Multiple exploratory conversations | Discovery / Qualification |
| Clear problem defined | Qualified Opportunity |
| Proposal or scope discussion | Proposal / Solutioning |
| Active commercial discussion | Negotiation |
| Existing client expansion | Expansion Opportunity |
| Returning relationship | Existing Relationship Opportunity |

### ASSESS CONFIDENCE
- High: company clear, contacts validated, no duplicate risk, stage obvious
- Medium: some ambiguity but deal creation is reasonable
- Low: company ambiguous, duplicate risk, or participants unclear

If confidence is Low AND company cannot be identified OR duplicate risk is high: skip deal creation, send Slack DM with reason.

## STEP 3 — CREATE DRAFT DEAL IN HUBSPOT

For emails that pass validation (High or Medium confidence):

1. First check if a pipeline called 'Pending Review' exists in HubSpot deals.
   - If it exists: create the deal there with stage 'Initial Meeting Scheduled'
   - If it does not exist: create the deal in the default deals pipeline at stage 'Initial Meeting Scheduled', and add a note to the deal: 'PENDING REVIEW — created by automated routine, awaiting approval before activation'

2. Set these deal fields:
   - Deal name: [Company Name] — [Service Type]
   - Associated company: the identified company
   - Associated contacts: all identified external contacts
   - Deal owner: Rachel at minimum (plus Jess/Jason if present in thread)
   - Initial meeting date: earliest relevant meeting date if found
   - Service type: Signal / Room / Build / General

3. Save the HubSpot deal URL from the response.

## STEP 4 — SEND SLACK DM

Send a Slack DM to Rachel (U0ACE0F48F6) using the Slack MCP tool (`slack_send_message`).

For a successfully created deal:
"🏢 *New Deal Draft Ready for Review*\n\n*Company:* [company]\n*Contacts:* [names and emails]\n*Service Type:* [type]\n*Deal Stage:* [stage]\n*Owners:* [owners assigned]\n*Meeting Date:* [date or Not found]\n*Confidence:* [High/Medium/Low]\n[any flags or ambiguities]\n\n🔗 View Draft Deal: [hubspot deal URL]"

For a skipped deal:
"⚠️ *Deal Creation Skipped*\n\n*Email:* [subject] from [sender]\n*Reason:* [why]\n*Recommendation:* [what to do manually]"

## STEP 5 — MARK EMAIL AS PROCESSED

Apply the Gmail label 'hubspot opp creation/done' to the email. If this label does not exist, create it first.

## IMPORTANT RULES
- Process ALL emails with the 'hubspot opp creation' label in this run
- Never create duplicate deals
- Never create a deal if company identity is ambiguous
- ALWAYS assign Rachel as deal owner — never leave owner blank
- Prefer conservative deal stages when uncertain
- Always send a Slack DM for every email processed
