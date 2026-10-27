# HubSpot Event Project Creator

A scheduled Claude agent that makes sure every HubSpot deal with an upcoming event or client meeting has a Notion project and a Google Drive folder, and that the HubSpot deal links to both.

## What It Does

Runs every weekday: a full run at 9am ET, plus reply-only runs at 11am, 1pm, 3pm and 5pm ET that just apply Rachel's new replies. On the full run it:

0. Applies Rachel's replies to the previous DMs (see "Replying to Baxter" below)
1. Fetches HubSpot deals where `event_date` falls within the next 28 days, **or** that have a HubSpot meeting linked to the deal in the next 28 days (Closed Lost excluded)
2. Finds the deal's existing Notion project using tiered matching (see below)
3. Creates a new Notion project only when there is no certain or possible match, with Tags derived from the deal's `service_type`
4. Makes sure the project has a Google Drive folder in "Now to Next Company Files" (links an existing folder or creates one under the tag-matched parent; root + "needs organizing" if no tag matches)
5. Writes `notion_project_url` and `drive_folder` back to the HubSpot deal
6. DMs Rachel (as Baxter) only when something changed or needs her review

## Project matching

All projects are loaded once per run with a SQL query on the Projects data source (no `notion-search`, which is a fuzzy workspace-wide search). Names are normalized first: lowercase, no punctuation, drop inc/llc/co/corp/ltd/the/and, drop anything after a dash (so "Cox Enterprises — General" → "cox enterprises").

| Tier | Rule | Action |
| --- | --- | --- |
| 1 — certain | Deal already has `notion_project_url`; or a project's notes contain `/deal/{deal_id}`; or normalized names are equal | Link it (write `notion_project_url`). If 2+ certain matches → "Needs review", nothing linked |
| 2 — possible | Open project (not Done/Lost) where one name contains the other, the project name contains the deal's company name, or half the key words of the shorter name overlap | Don't create, don't link. Listed in the DM under "Possible existing project — please confirm" |
| 3 — none | No match | Create the project |

To confirm a Tier 2 match, reply to Baxter's DM (below), or add the HubSpot deal link to the project's notes yourself. Either way it becomes a Tier 1 match.

## Replying to Baxter

Baxter's DM numbers every item that needs Rachel. She replies in the DM thread in plain language. Replies are applied within about 2 hours (runs at 9am, 11am, 1pm, 3pm, 5pm ET on weekdays), confirmed in the thread ("Done ✅ …"), and listed under "↩️ Applied from your replies" in the next morning's DM.

| Reply | Effect |
| --- | --- |
| `1 yes` | Link the deal to the suggested project (deal URL appended to project notes; `notion_project_url` and `drive_folder` set on the deal) |
| `1 no` | Create a new project + Drive folder for the deal; never asked again |
| `1 → [project name]` | Link the deal to a different named project |
| `2 → [folder]` | Move a folder created in the Drive root into that top-level folder |
| `skip 3` | Leave it |
| Anything unclear | Baxter asks one question in the thread and changes nothing |

Only Rachel's replies count; bot messages and @Claude mentions are ignored.

## Notion Database

**NTN Project Manager** — `15456cd2373b82e2bca10190134ace79` (data source `collection://7fe56cd2-373b-8368-a21c-87f2c9b61ec3`)

| Property | Type | Description |
| --- | --- | --- |
| Project Name | Title | Deal name from HubSpot |
| Timeline | Date range | Start = today, end = event_date (start only if no event date) |
| Status | Status | "Not started" |
| Tags | Multi-select | Derived from service_type (see mapping below) |
| Notes (migrated) | Text | HubSpot deal URL, event date, next meeting, deal stage, service type, company |
| Google Drive Folder | URL | Project's Drive folder |

### service_type → Tags mapping

| service_type | Notion Tags |
| --- | --- |
| Build / The Build | Client Delivery, The Build |
| Signal / The Signal | The Signal |
| Room / The Room | The Room |
| Ignite | Client Delivery, Ignite |
| General / (not set) | Client Delivery |

## Routine Configuration

| Field | Value |
| --- | --- |
| Routine ID | `trig_01G8A4CGDy9v5RPEAJq2uUJw` |
| Schedule | `0 13 * * 1-5` (9am EDT weekdays) |
| MCP Connections | HubSpot, Notion, Google Drive |
| Slack Sender | Baxter (`$BAXTER_TOKEN`, curl) |
| Prompt | [hubspot-event-project-creator-baxter.md](hubspot-event-project-creator-baxter.md) |

`hubspot-event-project-creator.md` is the older Slack-MCP variant (`trig_01MkPFkk5T8YP6Kyse2tau4V`) and does not include the Drive or tiered-matching logic.

## Recreating This Routine

1. Go to [claude.ai/code/routines](https://claude.ai/code/routines) and create a new routine
2. Set the schedule to `0 13 * * 1-5`
3. Attach the **HubSpot**, **Notion** and **Google Drive** MCP connectors, and add `BAXTER_TOKEN` as an environment variable
4. Paste the prompt from `hubspot-event-project-creator-baxter.md`
