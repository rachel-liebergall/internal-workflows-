---
name: save-to-project
description: Save context (email, Slack, file, or Drive content) to a Notion project page
---

You are running the Save to Project skill. Follow these instructions exactly.

## PURPOSE

Save reference material to a Now to Next client or project in Notion. Content is appended to the project's Notion page body and the Context checkbox is set to true.

## STEP 1 — IDENTIFY THE PROJECT

Search the Notion Projects database for an exact name match.

- Database ID: `fe656cd2-373b-83d7-8811-819b8173ecdf`
- Match on the `Project Name` (title) property
- Use EXACT match only — do not fuzzy match, do not guess

If no exact match is found:
- List the closest project names found (up to 5)
- Ask the user to clarify which project they meant
- Do NOT proceed until confirmed

If the project name was not provided: ask the user for it before searching.
If the content to save was not provided: ask the user for it before proceeding.

## STEP 2 — PREPARE THE CONTENT BLOCK

Format the content as follows:

```
---
📎 Context Added: [today's date]
Source: [Email / Slack / File / Drive / Note]
[Source detail line — see below]

[Full content body]
---
```

Source detail line by type:
- Email: `Email — Subject: "[subject]" from [sender name] <[email]>`
- Slack: `Slack — #[channel name] or DM`
- File: `File — [filename]`
- Drive: `Google Drive — [document title] — [URL]`
- Note: `Note`

For email threads: include each message with a `From: / Date:` header before its body.
For Slack threads: include each reply in order with author and timestamp.
For files: extract and include the full text content. If the file is non-text or very large, summarize the key points.
For Drive: fetch the document content if accessible; include full text or a structured summary.

If content exceeds ~10,000 characters: summarize to key points and add a note that the full version was truncated for length.

## STEP 3 — APPEND TO THE PROJECT PAGE

Append the formatted content block to the matched Notion project page body.

- Use the Notion append blocks API
- Prepend a horizontal divider block before the content
- Append the content as paragraph blocks (or quote/code as appropriate for the content type)
- NEVER overwrite existing page content — only append

## STEP 4 — SET THE CONTEXT CHECKBOX

Update the `Context` property on the project page:
- Property: `Context`
- Type: checkbox
- Value: `true`

## STEP 5 — CONFIRM

Reply with:

```
✅ Saved to **[Project Name]**

Source: [type]
[Subject / filename / channel / document title if applicable]
Notion page: [URL]
```

## RULES

- Exact project name match only — never save to the wrong project
- Never overwrite existing content — always append
- Always set Context checkbox to true after saving
- If the page cannot be updated: report the error clearly, do not proceed silently
- If content is ambiguous about which project it belongs to: ask the user to confirm before saving
