# Save to Project — Skill

## Overview

A reusable claude.ai skill that saves reference materials and context directly to a Now to Next project in Notion. Works from the claude.ai web or desktop app — no Claude Code installation required, so any team member can use it.

## Who Uses It

- Rachel (rachel@nowtonext.ai)
- Jess (jess@nowtonext.ai)
- Jason (jason@nowtonext.ai)

## How to Use

Invoke the skill with `/save-to-project` or by saying:
- "Save this to [Project Name]"
- "Add this email to the [Client] project"
- "Store this in the [Project Name] context"

Provide:
1. The exact project name (must match the Notion Projects database)
2. The content to save — email, Slack thread, file, Drive link, or pasted text

## What It Does

1. Finds the matching project page in the Notion Projects database (exact name match only)
2. Formats the content with a source header (date, type, subject/channel/filename)
3. Appends the content to the project page body — never overwrites existing content
4. Sets the **Context** checkbox on the project page to `true`
5. Confirms what was saved with a link to the Notion page

## Supported Source Types

| Source | What gets saved |
|---|---|
| Email | Sender, subject, date, full email body (or thread) |
| Slack | Channel/DM, author, timestamp, message + thread |
| File upload | Extracted text content or summary |
| Google Drive | Document URL + full text or summary |
| Pasted text / Note | Full text as provided |

## Notion Integration

- **Projects database ID:** `fe656cd2-373b-83d7-8811-819b8173ecdf`
- **Context column:** Checkbox property — set to `true` after each save
- Content is appended to the page body (not a property), allowing unlimited storage

## Rules

- Exact project name match only — will ask for clarification if no match found
- Always appends — never overwrites
- Always sets Context checkbox after saving
- Truncates very long content (>10,000 chars) with a summary note

## Requirements

- Notion connected in claude.ai (Project connector or via API key)
- Project must exist in the Notion Projects database with the exact name
