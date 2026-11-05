# Speaker Event Deck

Drafts a speaker deck for every upcoming speaking event, on the official Now to Next template, three days before the event. It saves the draft to the event's Drive folder and messages the event leaders that it's ready for review. Rebuilt Nov 5, 2026. It replaces the earlier version, which watched for Notion "deck" tasks and built an off-brand PPTX from scratch.

## How it works

`create-speaker-deck-baxter` runs at 9am ET on weekdays.

1. **Finds speaking events 1–3 days out** (on Fridays 1–4, so Tuesday events are covered before the weekend). It uses two sources:
   - HubSpot deals with Service Type = The Signal;
   - Notion projects tagged The Signal, or with Speaker(s) set.
   The first run that sees an event builds its deck, so in practice that's 3 days before.
2. **Skips events that already have a deck,** meaning a "Review speaker deck: …" task already exists, or the folder already holds a "Speaker Deck" file.
3. **Leaders** are the Notion project's Manager plus the HubSpot deal owner. If neither is set, the leader is Rachel.
4. **Loads the skills:**
   - **Project fetching** (project matching) gathers context and a harvest map from Notion, HubSpot, the event's Drive folder, Granola and past Signal decks.
   - **Brand Design Checker** handles layout choice, claim titles, cited numbers and the QA checklist.
   - **Brand Setup**, plus Jess Voice or Jason Voice according to Speaker(s), sets the voice.
   - The NTN Speaker Deck Playbook supplies past learnings.
5. **Writes the deck slide by slide:** layout, claim title, body, speaker notes and sources for each slide. Unknowns are marked `[NEEDS INPUT]`, never invented.
6. **Saves to the event's Drive folder:** project folder → deal folder → a new folder in Upcoming Speaker Events.
   - **Deck:** a copy of the official *NTN Google Slides General Template*, titled `[Project] - Speaker Deck - DRAFT - MM/DD/YY`.
   - **Content doc:** `[Project] - Speaker Deck Content - MM/DD/YY`, with the slide-by-slide content, finishing steps, input gaps, Brand QA results and sources.
   - If the folder holds a client template, it maps the content to that template instead (Workflow B).
7. **Creates a Notion task** "Review speaker deck: [Project]" for the leaders, due the day before the event, with a request to add Deck Notes afterwards.
8. **DMs each leader as Baxter** with the links. Rachel gets a one-line heads-up if she isn't a leader.

## Current limitation: slides are filled in by hand

The Google Drive connector can copy the template but can't edit slide text, so the leader pastes the content from the doc into the copied deck. Next step is a Google service account with Slides API access, stored as an environment variable, so the routine can fill the slides itself (`batchUpdate`: duplicate layouts, replace text, add speaker notes).

## Configuration

| Field | Value |
| --- | --- |
| Routine | `create-speaker-deck-baxter` · `trig_01YPMLFnticN545GzH7ssfFh` |
| Schedule | `0 14 * * 1-5` (UTC; 9am EST / 10am EDT) |
| MCP Connections | HubSpot, Notion, Google Drive, Granola |
| Slack | Baxter bot via `$BAXTER_TOKEN` (curl) |
| Prompt | [create-speaker-deck-baxter.md](create-speaker-deck-baxter.md) |
| Template | NTN Google Slides General Template `1qkcB4aOvxVT7fRtFwgYyHMakbGbbfm-a4itnx9dfkpk` |
| Playbook | NTN Speaker Deck Playbook `191e-gvOlEAZ_BfuoEJUIZNWWML6XOGl9_GXBEES_g1w` |
| Fallback folder | Upcoming Speaker Events `1RERSeJYFD08Bl3ysU9U1cMPezwYPoJC7` |

`deck-reflection-agent` (`trig_01UELX1NVCc158G3hGMKHtf9`, prompt in [REFLECTION.md](REFLECTION.md)) is still disabled. It could be re-enabled to read Deck Notes from the new review tasks and update the playbook.
