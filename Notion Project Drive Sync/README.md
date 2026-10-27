# Notion Project Drive Sync

Routines that keep the NTN Projects database in sync with Google Drive and HubSpot: linking projects to folders, creating missing folders, copying folder links to HubSpot deals, and auditing weekly.

## What It Does

**Folder Watcher (weekdays, 9:10am EDT):** Scans Notion projects (every status except Lost) for missing Google Drive folder links. For each one, it links an existing matching folder or creates a new folder under the tag-appropriate parent, then updates the project. If no tag matches, it creates the folder in the root and DMs Rachel. It then copies each project's folder link to its HubSpot deal's `drive_folder` field.

**Folder Audit (Fridays, 9am EDT):** Never changes Drive or Notion. Event date = the project's `Event Date`, else Timeline end, else the HubSpot deal's `event_date`. Only covers projects whose event is from 2 weeks ago onward (or that have no event date); older events are skipped entirely.
- **Nudges project Managers:** if a project folder is still empty and the event is within 2 weeks (before or after), Baxter DMs the project's `Manager` asking them to upload materials. If no Manager is set, the nudge goes to Rachel
- Flags for Rachel:
- **Missing Drive links**
- **Broken links:** folder deleted, trashed or moved
- **Wrong location:** the folder's parent doesn't match the project tag
- **Orphaned folders:** Drive folders with no matching Notion project

DMs Rachel only if something is flagged.

**One-Time Backfill (Manual):** The original job that added the `Google Drive Folder` URL property and populated it. Parked. Its prompt still references the old database ID and statuses.

See also [HubSpot Event Project Creator](../HubSpot%20Event%20Project%20Creator/README.md), which creates projects and folders for deals with an upcoming event or linked client meeting.

## Notion Database

**Projects** — `15456cd2373b82e2bca10190134ace79` (data source `collection://7fe56cd2-373b-8368-a21c-87f2c9b61ec3`)

| Property | Type | Description |
| --- | --- | --- |
| Project Name | Title | Used for Drive folder name matching |
| Status | Status | Not started, Backlog, In progress, Behind, On Hold, Done included; Lost skipped |
| Tags | Multi-select | Determines which Drive subfolder to use |
| Timeline | Date range | End date = event date (used by the audit's empty-folder check) |
| Notes (migrated) | Text | Holds the HubSpot deal URL that links a project to its deal |
| Google Drive Folder | URL | Populated and maintained by these routines |

### Drive Folder Structure

Tag values map to subfolders inside **Now to Next Company Files**:

| Project Tag | Drive Subfolder |
| --- | --- |
| Signal / The Signal | Signal |
| Room / The Room | Room |
| Client Delivery / The Build | Client Delivery |
| No match | Root (`Now to Next Company Files`) + Slack alert to Rachel |

## Routine Configuration

| Field | Folder Watcher | Folder Audit | Backfill |
| --- | --- | --- | --- |
| Routine ID | `trig_01QwuNoQeaJFP7E4HFEfavaY` | `trig_012oWPh6wjH99VBrW5ioxZDQ` | `trig_01W6t7b5SLKcaWzuwkmPnD2H` |
| Schedule | `10 13 * * 1-5` | `0 13 * * 5` | parked |
| MCP Connections | Notion, Google Drive, HubSpot | Notion, Google Drive, HubSpot | Notion, Google Drive |
| Slack Sender | Baxter (`$BAXTER_TOKEN`) | Baxter (`$BAXTER_TOKEN`) | None |

## Recreating This Routine

1. Go to [claude.ai/code/routines](https://claude.ai/code/routines) and create a new routine
2. Set the schedule (see table above)
3. Attach the **Notion**, **Google Drive** and **HubSpot** MCP connectors
4. Add `BAXTER_TOKEN` as an environment variable
5. Paste the prompt from the corresponding `.md` file
