# Speaker Event Deck

A Claude Code remote routine that creates a thought leadership presentation draft for an upcoming speaker event. Triggered manually via "Run now" in claude.ai/code/routines (or on a monthly schedule), it reads a pending Notion task, gathers context from across your stack, generates a PPTX file, and uploads everything to Google Drive.

## How To Trigger

1. Create a Notion task in the **Tasks** database with "deck", "speaker", or "presentation" in the title, and set it to any status except Done, Complete, or In Review
2. Go to [claude.ai/code/routines](https://claude.ai/code/routines) and hit **Run now** on `create-speaker-deck`

Claude will handle the rest.

## What It Does

1. Reads the **Tasks** Notion database for any pending deck/speaker/presentation task
2. Pulls context from Notion (project), Google Drive (existing decks + template), Granola (meeting transcripts), Google Calendar (event details), and Gmail (email threads)
3. Writes full slide-by-slide content — headlines, body copy, speaker notes
4. Generates an actual `.pptx` file using python-pptx (if a template is found in Drive, it's used as the base)
5. Creates a new event subfolder in **Upcoming Speaker Events** on Google Drive
6. Uploads the PPTX and a companion slide content Google Doc to that folder
7. Updates the Notion task status to **In Review** and adds the Drive folder and doc links
8. Sends a Slack DM to each assigned task owner

## Output

| Item | Location |
| --- | --- |
| Event folder | Google Drive → Upcoming Speaker Events → [Event Name] |
| PPTX file | Inside the event folder |
| Slide content doc | Inside the event folder (Google Doc with full copy) |
| Notion task | Updated with Drive links, status set to In Review |
| Slack notification | DM to each assigned task owner |

## Routine Configuration

| Field | Value |
| --- | --- |
| Routine ID | `trig_01YPMLFnticN545GzH7ssfFh` |
| Model | claude-sonnet-4-6 |
| Schedule | Monthly (primarily triggered via Run now) |
| MCP Connections | Notion, Google Drive, Gmail, Google Calendar, Granola, Slack |

## Key IDs

| Resource | ID |
| --- | --- |
| Upcoming Speaker Events (Drive folder) | `1RERSeJYFD08Bl3ysU9U1cMPezwYPoJC7` |
| Projects (Notion DB) | `15456cd2373b82e2bca10190134ace79` |
| Tasks (Notion DB) | `36e56cd2373b8325939281a80a6cb5d9` |

## Notes

- The agent uses Bash + python-pptx to generate an actual PPTX file (not a Google Slides file)
- If a template is found in the Upcoming Speaker Events Drive folder, it's downloaded and used as the base; otherwise a clean deck is generated
- The SKILL.md in this folder contains the full agent prompt used by the routine
