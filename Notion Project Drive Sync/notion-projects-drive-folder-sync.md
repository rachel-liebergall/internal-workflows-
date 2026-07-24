---
name: notion-projects-drive-folder-sync
description: One-time backfill job. Adds a 'Google Drive Folder' URL property to the NTN Projects database, then populates it for all active projects by searching Client Delivery first, then the full Now to Next Company Files hierarchy.
trigger_id: trig_01W6t7b5SLKcaWzuwkmPnD2H
schedule: Manual / one-time (cron parked at 0 0 1 1 0)
mcp_connections: Notion, Google Drive
---

You are running a one-time data enrichment job for Now to Next. Your goal is to add a 'Google Drive Folder' URL property to the NTN Project Manager Notion database, then populate it for all active projects by finding their matching folder in Google Drive.

## NOTION
- Projects database ID: 9f556cd2373b8209ab98815e295f177e
- Target property name: Google Drive Folder (type: URL)
- Active statuses to include: Active, In Progress, Not Started, Ongoing, Done

## GOOGLE DRIVE
- Root: Now to Next Company Files
- Primary search location: Client Delivery subfolder
- Fallback: entire Now to Next Company Files hierarchy

## STEP 1 — ADD PROPERTY TO NOTION DATABASE

Fetch the Projects database schema using notion-fetch on database ID 9f556cd2373b8209ab98815e295f177e. Check whether a property named 'Google Drive Folder' already exists.

If it does NOT exist: use notion-update-data-source to add a URL property named 'Google Drive Folder' to the database.

If it already exists: note that and proceed.

## STEP 2 — QUERY ALL ACTIVE PROJECTS FROM NOTION

Query the Projects database filtering for projects whose Status is one of: Active, In Progress, Not Started, Ongoing, Done.

For each project, collect:
- Page ID
- Project Name (title property)
- Tag/category property (whatever the property is named — inspect the schema)
- Current value of 'Google Drive Folder' property (if any)

## STEP 3 — BUILD DRIVE FOLDER INDEX

### 3A — Index Client Delivery
Navigate to: Now to Next Company Files > Client Delivery. List ALL folders directly inside it. Store each folder's name and web view link.

### 3B — Index full company repository (for fallback)
List ALL folders directly inside 'Now to Next Company Files' (top level). For each top-level subfolder, also list its immediate children. Store name + web view link for every folder found. This gives you a two-level-deep index of the full repository.

## STEP 4 — MATCH PROJECTS TO DRIVE FOLDERS

For each Notion project:
1. Skip any project that already has a 'Google Drive Folder' value.
2. First search the Client Delivery index (3A) for a name match.
3. If no match in Client Delivery, search the full repository index (3B).
4. Matching logic (case-insensitive, applied at each level):
   - Exact: folder name equals project name
   - Contains: folder name contains the project name, or vice versa
   - Fuzzy: strip common words ("the", "and", "&", "LLC", "Inc", "Co"), check if core words overlap significantly
5. If one clear match found: record it.
6. If multiple matches: pick the closest. If still ambiguous, skip and note.
7. If no match anywhere: skip and note.

## STEP 5 — UPDATE NOTION PROJECTS

For each matched project, call notion-update-page to set 'Google Drive Folder' to the Drive folder's web view link.

## STEP 6 — REPORT

Print a summary:
```
✅ Property added/confirmed: Google Drive Folder

Updated (X projects):
- [Project Name] → [Drive folder URL] (found in: Client Delivery / [subfolder])

Skipped — already had value (X projects):
- [Project Name]

Skipped — no matching Drive folder found (X projects):
- [Project Name] (tag: [tag value])

Skipped — ambiguous match (X projects):
- [Project Name] → candidates: [folder1], [folder2]
```

Finish after printing the report.
