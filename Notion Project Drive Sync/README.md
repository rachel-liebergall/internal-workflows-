# Notion Project Drive Sync

Three routines that keep the NTN Projects database in sync with Google Drive — automatically linking projects to folders, creating missing folders, and auditing mismatches weekly.

## What It Does

**Folder Watcher (Mon & Thu, 9am EDT):** Scans all active Notion projects for missing Google Drive folder links. For each project without a link, it searches Drive for an existing folder match. If none is found, it creates a new folder in the tag-appropriate location and updates the Notion project with the link. Falls back to the root company folder and alerts Rachel via Slack if no tag match is found.

**Folder Audit (Fridays, 9am EDT):** Compares all Notion projects against Drive and flags four types of mismatches: missing Drive links, broken links (folder deleted or moved), folders in the wrong location based on project tag, and Drive folders with no matching Notion project. Sends a Slack DM to Rachel only if issues are found.

**One-Time Backfill (Manual):** The original job that added the `Google Drive Folder` URL property to the Projects database and populated it for all existing projects. Parked — not scheduled to run again.

## Notion Database

**NTN Project Manager** — `9f556cd2373b8209ab98815e295f177e`

| Property | Type | Description |
| --- | --- | --- |
| Project Name | Title | Used for Drive folder name matching |
| Status | Status | Active, In Progress, Not Started, Ongoing, Done (all included) |
| Tags | Multi-select | Determines which Drive subfolder to use |
| Google Drive Folder | URL | Populated and maintained by these routines |

### Drive Folder Structure

Tag values map to subfolders inside **Now to Next Company Files**:

| Project Tag | Drive Subfolder |
| --- | --- |
| Signal / The Signal | Signal |
| Room / The Room | Room |
| Client Delivery / The Build | Client Delivery |
| No match | Root (`Now to Next Company Files`) + Slack alert to Rachel |

## Schedule

| Routine | Schedule |
| --- | --- |
| Folder Watcher | Mondays and Thursdays at 9am EDT |
| Folder Audit | Fridays at 9am EDT |
| Backfill | Manual / one-time |

## Routine Configuration

| Field | Folder Watcher | Folder Audit | Backfill |
| --- | --- | --- | --- |
| Routine ID | `trig_01QwuNoQeaJFP7E4HFEfavaY` | `trig_012oWPh6wjH99VBrW5ioxZDQ` | `trig_01W6t7b5SLKcaWzuwkmPnD2H` |
| Model | claude-sonnet-4-6 | claude-sonnet-4-6 | claude-sonnet-4-6 |
| Schedule | `0 13 * * 1,4` | `0 13 * * 5` | `0 0 1 1 0` (parked) |
| MCP Connections | Notion, Google Drive | Notion, Google Drive | Notion, Google Drive |
| Slack Sender | Baxter (`$BAXTER_TOKEN`) | Baxter (`$BAXTER_TOKEN`) | None |
| Projects DB | `9f556cd2373b8209ab98815e295f177e` | `9f556cd2373b8209ab98815e295f177e` | `9f556cd2373b8209ab98815e295f177e` |

## Recreating This Routine

To recreate the Folder Watcher or Folder Audit:

1. Go to [claude.ai/code/routines](https://claude.ai/code/routines) and create a new routine
2. Set the appropriate schedule (see table above)
3. Attach **Notion** and **Google Drive** MCP connectors
4. Add `BAXTER_TOKEN` as an environment variable
5. Paste the prompt from the corresponding `.md` file as the agent instructions
