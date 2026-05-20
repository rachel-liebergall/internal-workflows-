# Create Speaker Event Deck

You are a remote Claude agent running in Anthropic's cloud. You will read a pending Notion task, gather context from multiple sources, generate a full thought leadership PPTX deck using python-pptx, upload it to Google Drive, update the Notion task, and notify the assigned owners via Slack.

---

## Step 1: Find the Pending Notion Task

Search the **Tasks** database (https://www.notion.so/36e56cd2373b8325939281a80a6cb5d9) for a task whose title contains "deck", "speaker", or "presentation" (case-insensitive) AND whose status is NOT Done, Complete, or In Review.

If no task is found, stop and report: "No pending speaker deck task found in Notion."

From the task, extract:
- Event/client name (the subject of the deck)
- Assigned owners
- Any notes or linked project

Also search the **Projects** database (https://www.notion.so/15456cd2373b82e2bca10190134ace79) for a project matching the event/client name and read any relevant context.

---

## Step 2: Check for a Deck Template in Drive

Search the **Upcoming Speaker Events** Google Drive folder (ID: `1RERSeJYFD08Bl3ysU9U1cMPezwYPoJC7`) for any file with "template" in the name.

If found:
- Note the file ID
- Download the file content as base64
- Save it to `/tmp/template.pptx`
- Use it as the base for the new deck (python-pptx can open and modify it)

If not found: generate a clean deck from scratch.

---

## Step 3: Gather Context

Search all of these sources for content about the client/event:

1. **Google Drive** — search the Upcoming Speaker Events folder and broadly across Drive for existing decks, briefs, or materials referencing the client name
2. **Granola** — search for meeting transcripts mentioning the client or event; extract themes, audience details, goals, talking points
3. **Google Calendar** — find the event; note date, format, audience, agenda
4. **Gmail** — find email threads with briefs, speaker requirements, topic requests, or audience expectations
5. **Notion Projects DB** — read the linked project page for background and positioning

---

## Step 4: Synthesize Slide Outline

Based on gathered context, write the full content for each slide. This is a **thought leadership** presentation — it should position Now to Next as a credible, opinionated voice, not pitch services.

Use this default structure (11 slides):

1. **Title** — event name, speaker name, date, NTN tagline
2. **About Now to Next** — brief, credibility-building (2-3 lines max)
3. **The Landscape** — what's happening in the industry right now
4. **The Tension** — the core problem or question leaders are wrestling with
5. **Insight 1** — specific, opinionated point of view with supporting evidence
6. **Insight 2**
7. **Insight 3**
8. **A Framework or Model** — something visual and memorable (describe it clearly)
9. **Proof Points** — real examples, outcomes, or stories
10. **What To Do Next** — one clear, actionable takeaway for the audience
11. **Q&A / Contact** — speaker name, email, NTN website

For each slide write:
- **Headline:** (the main message, 8 words or fewer)
- **Body:** (bullet points or short paragraphs)
- **Speaker notes:** (what to say out loud — 2-4 sentences)

---

## Step 5: Generate the PPTX

Run the following in Bash:

```bash
pip install python-pptx -q
```

Then write a Python script to `/tmp/generate_deck.py` that:
- If `/tmp/template.pptx` exists: opens it with `Presentation('/tmp/template.pptx')` and populates or replaces slides
- If no template: creates a new `Presentation()` and adds slides with titles and body text using layouts
- Saves output to `/tmp/speaker-deck.pptx`

Run the script: `python3 /tmp/generate_deck.py`

Verify `/tmp/speaker-deck.pptx` was created.

---

## Step 6: Upload to Google Drive

1. Read `/tmp/speaker-deck.pptx` as base64:
   ```bash
   base64 /tmp/speaker-deck.pptx
   ```

2. Create a new subfolder in the Upcoming Speaker Events folder (ID: `1RERSeJYFD08Bl3ysU9U1cMPezwYPoJC7`) named after the event (e.g. `Foro — June 2026`)

3. Upload the PPTX into the new subfolder using the Drive MCP `create_file` tool:
   - `name`: `[ClientName] — Speaker Deck — DRAFT.pptx`
   - `mimeType`: `application/vnd.openxmlformats-officedocument.presentationml.presentation`
   - `base64Content`: the base64 string from step 1
   - `disableConversionToGoogleType`: true
   - `parentFolderId`: the new subfolder ID

4. Create a companion Google Doc in the same subfolder titled `[ClientName] — Deck Content` containing the full slide-by-slide outline from Step 4 (headlines, body, speaker notes for every slide). Add a note at the top: "Copy this content into the deck file slide-by-slide. PPTX is in this folder."

5. Note the shareable links to both files.

---

## Step 7: Update Notion Task

1. Find the task identified in Step 1
2. Update the task status to **In Review**
3. Add the Google Drive folder link and the deck content doc link to the task description

---

## Step 8: Send Slack Notification

1. From the Notion task, identify the assigned owners
2. Look up each owner's Slack user ID (search Slack users by name or email)
3. Send each owner a direct Slack message:

   > Hey — the speaker deck draft for **[Event Name]** is ready for review.
   >
   > 📁 Drive folder: [link]
   > 📊 PPTX deck: [link]
   > 📝 Slide content doc: [link]
   > ✅ Notion task: [link]
   >
   > The content doc has the full slide-by-slide copy. Let me know if anything needs adjusting.

---

## When Done

Report back with:
- Event name and slide count
- Links: Drive folder, PPTX file, content doc, Notion task
- Sources used: meetings found, emails found, Drive files referenced
- Notion task status updated to: In Review
- Who was notified on Slack
