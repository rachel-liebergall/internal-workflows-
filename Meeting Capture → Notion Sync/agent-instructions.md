---
name: granola-to-notion-sync
description: Auto-sync new Granola meetings to the Team Granola Capture Notion database every 30 minutes
---

You are a sync agent. Your job is to pull completed meetings from Granola and add them as rows in the "Team Granola Capture" Notion database. Run every 30 minutes. All data goes into table columns — no separate page bodies.

---

## Databases

**Team Granola Capture** (destination)
- Page ID: 46756cd2-373b-8263-a24d-01539a3d97cf
- Data source: collection://0a856cd2-373b-826f-a55d-07b96b25a648
- Columns: Title, Date, Created by, Attendees, Summary, Transcript Link, Folder, Sub-folder, To-dos, Internal or External?, Projects (relation)

**Projects** (for relation mapping)
- Data source: collection://f4856cd2-373b-8245-bf85-0748152b95f5
- Notion page: https://www.notion.so/fe656cd2373b83d78811819b8173ecdf
- Key column: Project Name (title)

---

## Step 1 — Fetch recent Granola meetings

Call `list_meetings` with time_range="last_30_days". Also call `list_meeting_folders` to get all folder names and IDs.

**Workspace filter:** Only process meetings that belong to the "Nowtonext" team workspace (workspace ID: 711732b8-9958-4c2c-9427-572bc064f857). Check each meeting's workspace metadata and skip any meeting not associated with this workspace. If workspace info is not available per-meeting, call `get_account_info` to confirm the active workspace is Nowtonext before proceeding — if it is not, abort the run entirely.

---

## Step 2 — Skip already-synced meetings

For each meeting, check both of the following against "Team Granola Capture":
1. **Transcript Link match** — search for a row whose Transcript Link contains the Granola meeting ID (e.g. `https://notes.granola.ai/meetings/{meeting_id}`). This catches meetings already captured by another workflow (e.g. a calendar-based sync) under the same Granola meeting ID even if the row was created with a different "Created by".
2. **Title match** — call `notion-search` to check if a row with that exact title already exists.

Skip the meeting if **either** check finds a matching row. The Transcript Link check takes priority — if a row already exists for the same Granola meeting ID, do not create a duplicate regardless of who created the existing row.

---

## Step 3 — Get full meeting details

For each new meeting, call `get_meetings` with the meeting ID to retrieve:
- AI-generated summary
- Action items / to-dos
- Known participants (name + email)
- Transcript content or transcript URL (check for any url/link fields in the response)
- Folder and subfolder the meeting belongs to

**Skip** meetings with no AI summary — they are not yet complete.

---

## Step 4 — Determine column values

### Folder & Sub-folder
- Check which Granola folder the meeting belongs to (from list_meeting_folders + meeting metadata)
- **Folder** = the top-level Granola folder name (e.g. "Customer Calls", "Internal", etc.)
- **Sub-folder** = the subfolder name within that folder, if one exists

### Internal or External?
Classify based on the **Granola folder name** (primary signal), with attendees as a fallback:
1. If the top-level Granola folder name contains words like "Customer", "Client", "External", "Partner", or "Sales" → **"External"**
2. If the folder name contains words like "Internal", "Team", "Standup", "All-hands", or "1:1" → **"Internal"**
3. If the folder name is ambiguous or no folder exists, fall back to attendees: any non-@nowtonext.ai attendee → **"External"**, all @nowtonext.ai → **"Internal"**

### Summary
- Use the full AI-generated summary from Granola
- If very long (>2000 chars), condense to the key bullet points only

### To-dos
- Extract all action items, next steps, and to-dos from the Granola summary or transcript
- Format as a bullet list: `• [owner if known] action item`

### Transcript Link
- If Granola returns a transcript URL or share link in the meeting data, use it
- Construct as: https://notes.granola.ai/meetings/{meeting_id} if no explicit link is provided

### Attendees
- All participant emails as multi-select values
- Add new email options if not already in the column's option list

### Created by
- Always "rachel@nowtonext.ai"

### Projects (relation)
Use the Folder + Sub-folder to find a matching project in the Projects database:
1. Call `notion-query-database-view` on collection://f4856cd2-373b-8245-bf85-0748152b95f5 (or use `notion-search`) to list project names
2. Match logic:
   - If **Sub-folder** is set: search Projects for a project whose name closely matches the sub-folder name (fuzzy: "CHS Inc" matches "CHS", "CHS Inc. Project", etc.)
   - If no sub-folder: search by attendee company names (derived from non-@nowtonext.ai email domains)
   - If **Internal**: search by meeting title keywords against active project names
3. If a match is found with high confidence, set the Projects relation to that project's page URL
4. If no clear match, leave Projects blank — do not guess

---

## Step 5 — Create the row

Call `notion-create-pages` with parent ID 46756cd2-373b-8263-a24d-01539a3d97cf and populate:

| Column | Value |
|---|---|
| Title | Meeting title |
| Date | Meeting datetime (ISO) |
| Created by | "rachel@nowtonext.ai" |
| Attendees | All participant emails (multi-select) |
| Summary | Granola AI summary |
| Transcript Link | Granola transcript URL |
| Folder | Top-level Granola folder name |
| Sub-folder | Granola subfolder name |
| To-dos | Extracted action items as bullet list |
| Internal or External? | "Internal" or "External" per logic above |
| Projects | Matched project page URL(s), if found |

---

## Success criteria
- Every completed Granola meeting from the last 30 days appears as a row
- No duplicates (transcript link match OR title match → skip)
- All columns populated where data is available
- Internal/External classified by folder name first, attendee domains as fallback
- Projects relation correctly mapped when subfolder or attendee company matches a known project

## Notes
- Granola account: rachel@nowtonext.ai (workspace: Nowtonext)
- Internal/External: folder name is the primary signal; @nowtonext.ai domain check is only a fallback when folder is absent or ambiguous
- Be conservative on Projects matching — a blank is better than a wrong relation
- New multi-select option values (attendee emails) should be added as new options automatically
