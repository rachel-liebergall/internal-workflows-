# Speaker Event Deck

A Claude project skill that creates a thought leadership presentation draft for an upcoming speaker event. Triggered by a natural language request, it gathers context from across your stack and delivers a ready-to-fill deck in Google Drive, an updated Notion task, and a Slack notification to the assigned owners.

## How To Use

In your Claude project, type:

```
Create a speaker deck for [client/event name]
```

Claude will handle the rest.

## What It Does

1. Checks for a deck template (project file or Google Drive)
2. Pulls context from Notion (project + task), Google Drive (existing decks), Granola (meeting transcripts), Google Calendar (event details), and Gmail (email threads)
3. Writes full slide-by-slide content — headlines, body copy, speaker notes
4. Creates a new event subfolder in **Upcoming Speaker Events** on Google Drive
5. Copies the template into the folder and creates a companion content doc
6. Updates the Notion task with Drive links and marks it as draft ready
7. Sends a Slack DM to each assigned owner with links to everything

## Output

| Item | Location |
| --- | --- |
| Event folder | Google Drive → Upcoming Speaker Events → [Event Name] |
| Template copy | Inside the event folder, renamed as DRAFT |
| Slide content doc | Inside the event folder |
| Notion task | Updated with Drive links and status |
| Slack notification | DM to each assigned task owner |

## Setup (Claude Project)

1. **Create a Claude project** on claude.ai or Claude Desktop
2. **Connect MCPs:** Google Drive, Gmail, Google Calendar, Granola, Notion, Slack
3. **Upload your deck template** as a project file so Claude can reference its structure
4. **Add the contents of `SKILL.md`** to the project's custom instructions

## Key IDs (hardcoded in SKILL.md)

| Resource | ID |
| --- | --- |
| Upcoming Speaker Events (Drive folder) | `1RERSeJYFD08Bl3ysU9U1cMPezwYPoJC7` |
| Projects (Notion DB) | `15456cd2373b82e2bca10190134ace79` |
| Tasks (Notion DB) | `36e56cd2373b8325939281a80a6cb5d9` |

## Notes

- No Bash required — works in claude.ai web and Claude Desktop
- Deck content is written as a Google Doc structured slide-by-slide; paste into the template copy to complete the deck
- This skill is designed to be triggered manually for now — a Notion task trigger will automate it in a future workflow
