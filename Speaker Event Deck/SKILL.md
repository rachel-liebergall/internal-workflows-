# Create Speaker Event Deck

You are creating a thought leadership presentation deck for an upcoming speaker event. You will gather context from multiple sources, generate structured slide content, copy the deck template into a new event folder on Google Drive, create a companion content document, update the Notion task, and notify the assigned owners via Slack.

## Input

Extract the client or event name from the user's message. This is your primary search key across all sources.

---

## Step 1: Check for a Deck Template

1. Check if a presentation template has been uploaded to this Claude project. If yes, note its structure — number of slides, slide types, layout names, and any placeholder conventions (e.g. [TITLE], [BODY], speaker info placement)
2. Also search Google Drive for a template file in the **Upcoming Speaker Events** folder (ID: `1RERSeJYFD08Bl3ysU9U1cMPezwYPoJC7`) — look for files with "template" in the name
3. If a template is found in Drive, note its file ID — you will copy it in Step 6
4. If no template is found anywhere, proceed with a standard 10-12 slide thought leadership structure

---

## Step 2: Gather Notion Context

1. Search the **Projects** database (https://www.notion.so/15456cd2373b82e2bca10190134ace79) for a project matching the client/event name
2. Search the **Tasks** database (https://www.notion.so/36e56cd2373b8325939281a80a6cb5d9) for a task related to creating a deck or presentation for this project
3. Note the project details, assigned owners, and task ID — you will update this task and notify these owners at the end

---

## Step 3: Gather Google Drive Context

1. Search the **Upcoming Speaker Events** folder (ID: `1RERSeJYFD08Bl3ysU9U1cMPezwYPoJC7`) for any existing decks, briefs, or materials related to this client or event
2. Read any relevant files to understand content already developed for this event
3. Search broadly across Drive for any other presentations or documents referencing the client name — past decks are valuable reference for tone, structure, and content depth

---

## Step 4: Gather Meeting & Email Context

1. Search **Granola** for meeting transcripts mentioning the client or event name — extract key themes, talking points, goals, and audience details
2. Search **Google Calendar** for events related to the client — note the event date, format, audience, and any agenda details visible
3. Search **Gmail** for email threads related to the client — look for briefs, speaker requirements, topic requests, or any audience expectations

---

## Step 5: Synthesize Slide Content

Based on all gathered context, write the full content for each slide. This is a **thought leadership** presentation — it should position Now to Next as a credible, opinionated voice, not pitch services.

Match the number and type of slides to the template structure if one was found. If no template, use this default structure:

1. **Title** — event name, speaker name, date, NTN tagline
2. **About Now to Next** — brief, punchy, credibility-building (2-3 lines max)
3. **The Landscape** — what's happening in the industry right now (data point or observation)
4. **The Tension** — the core problem or question leaders are wrestling with
5. **Insight 1** — a specific, opinionated point of view with supporting evidence
6. **Insight 2**
7. **Insight 3**
8. **A Framework or Model** — something visual and memorable (describe it clearly for the slide)
9. **Proof Points** — real examples, outcomes, or stories
10. **What To Do Next** — one clear, actionable takeaway for the audience
11. **Q&A / Contact** — speaker name, email, NTN website

For each slide write:
- **Headline:** (the main message, 8 words or fewer)
- **Body:** (bullet points or short paragraphs as appropriate)
- **Speaker notes:** (what to say out loud — 2-4 sentences)

---

## Step 6: Create Event Folder and Copy Template

1. In the **Upcoming Speaker Events** Google Drive folder (ID: `1RERSeJYFD08Bl3ysU9U1cMPezwYPoJC7`), create a new subfolder named after the event (e.g. `Foro — June 2026`)
2. If a template file was found in Step 1, copy it into the new subfolder and rename it: `[ClientName] — Speaker Deck — DRAFT`
3. If no template was found, create a new Google Doc in the folder titled `[ClientName] — Speaker Deck — DRAFT` and note that it will need to be formatted into slides

---

## Step 7: Create the Slide Content Document

1. In the same event subfolder, create a new Google Doc titled: `[ClientName] — Deck Content`
2. Write the full slide-by-slide content into this doc, structured clearly by slide number and type
3. Include headlines, body copy, and speaker notes for every slide
4. Add a note at the top: "Copy this content into the deck template slide-by-slide. Template is in this folder."
5. Note the shareable links to both the template copy and the content doc

---

## Step 8: Update Notion Task

1. Find the task identified in Step 2
2. Add the Google Drive folder link and the deck content doc link to the task description
3. Update the task status to reflect the draft is ready — check what status values exist in the database and use the most appropriate one (e.g. "In Progress", "Review", "Draft Ready")

---

## Step 9: Send Slack Notification

1. From the Notion task, identify the assigned owners
2. Look up each owner's Slack username (search Slack users by name if needed)
3. Send each owner a direct Slack message:

   > Hey — the speaker deck draft for **[Event Name]** is ready for review.
   >
   > 📁 Drive folder: [link]
   > 📝 Slide content doc: [link]
   > ✅ Notion task: [link]
   >
   > The content doc has the full slide-by-slide copy. The template copy is in the same folder. Let me know if anything needs adjusting.

---

## When Done

Report back with:
- Event name and slide count
- Links: Drive folder, template copy, content doc, Notion task
- Sources used: meetings found, emails found, Drive files referenced
- Who was notified on Slack
