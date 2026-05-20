# Speaker Event Deck

Two Claude Code remote routines that handle the full speaker deck lifecycle — from creation through post-event learning.

## Routines

### 1. `create-speaker-deck`
Runs automatically at **9am and 1pm ET daily**. Finds any pending deck task in Notion, gathers context, generates a PPTX, and uploads everything to Google Drive.

**Trigger:** Create a Notion task with "deck", "speaker", or "presentation" in the title, status anything except Done/Cancelled/To Review.

### 2. `deck-reflection-agent`
Runs every **Monday at 9am ET**. Reviews completed deck tasks, enforces Deck Notes, extracts learnings, and updates the Deck Playbook.

**Enforcement:** If a deck task is marked Done without Deck Notes filled in, the routine reverts it to "To Review" and DMs the owner.

---

## Full Workflow

1. Create a Notion task with "deck" or "speaker" in the title
2. `create-speaker-deck` picks it up → builds the PPTX → uploads to Drive → sets task to **To Review** → Slacks owners with links and a reminder to fill in Deck Notes after the presentation
3. After the event, owner fills in **Deck Notes** on the Notion task and marks it **Done**
4. `deck-reflection-agent` extracts learnings from Deck Notes → appends to the **NTN Speaker Deck Playbook** in Drive → future decks are informed by this playbook
5. If Done is marked without Deck Notes → routine reverts to To Review and sends a Slack nudge

---

## Routine Configuration

| Routine | ID | Schedule | MCPs |
| --- | --- | --- | --- |
| create-speaker-deck | `trig_01YPMLFnticN545GzH7ssfFh` | 9am + 1pm ET daily | Notion, Drive, Gmail, Calendar, Granola, Slack |
| deck-reflection-agent | `trig_01UELX1NVCc158G3hGMKHtf9` | Monday 9am ET | Notion, Drive, Slack |

Manage routines: https://claude.ai/code/routines

## Key IDs

| Resource | ID |
| --- | --- |
| Upcoming Speaker Events (Drive folder) | `1RERSeJYFD08Bl3ysU9U1cMPezwYPoJC7` |
| NTN Speaker Deck Playbook (Drive doc) | `191e-gvOlEAZ_BfuoEJUIZNWWML6XOGl9_GXBEES_g1w` |
| Projects (Notion DB) | `15456cd2373b82e2bca10190134ace79` |
| Tasks (Notion DB) | `36e56cd2373b8325939281a80a6cb5d9` |

## Files

| File | Contents |
| --- | --- |
| `SKILL.md` | Full prompt for `create-speaker-deck` routine |
| `REFLECTION.md` | Full prompt for `deck-reflection-agent` routine |
