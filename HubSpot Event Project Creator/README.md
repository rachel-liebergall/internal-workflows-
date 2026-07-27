# HubSpot Event Project Creator

A scheduled Claude agent that finds HubSpot deals with upcoming events and auto-creates the corresponding project in Notion — then writes the Notion URL back to the HubSpot deal.

## What It Does

Runs every weekday at 9am EDT. On each run it:

1. Fetches all open HubSpot deals where `event_date` falls within the next 28 days
2. Checks whether each deal already has a corresponding Notion project (via HubSpot `notion_project_url` field or Notion search)
3. Creates a new Notion project for any deal missing one, with Tags derived from the deal's `service_type`
4. Writes the new Notion project URL back to the HubSpot deal (`notion_project_url` property)
5. Sends a Slack DM to Rachel summarizing what was created and what was skipped

## Notion Database

**NTN Project Manager** — `15456cd2373b82e2bca10190134ace79`

| Property | Type | Description |
| --- | --- | --- |
| Project Name | Title | Deal name from HubSpot |
| Timeline | Date range | Start = today, end = event_date |
| Status | Status | "Not started" |
| Tags | Multi-select | Derived from service_type (see mapping below) |
| Notes (migrated) | Text | HubSpot deal URL, event date, deal stage, service type, company |

### service_type → Tags mapping

| service_type | Notion Tags |
| --- | --- |
| Build / The Build | Client Delivery, The Build |
| Signal / The Signal | The Signal |
| Room / The Room | The Room |
| General / (not set) | Client Delivery |

## Schedule

- **Automatic:** Weekdays at 9am EDT

## Routine Configuration

Two variants exist — one uses Baxter's bot token for Slack, the other uses the Slack MCP connector:

| Field | Baxter Variant | MCP Variant |
| --- | --- | --- |
| Routine ID | `trig_01G8A4CGDy9v5RPEAJq2uUJw` | `trig_01MkPFkk5T8YP6Kyse2tau4V` |
| Model | claude-sonnet-4-6 | claude-sonnet-4-6 |
| Schedule | `0 13 * * 1-5` | `0 13 * * 1-5` |
| MCP Connections | HubSpot, Notion | HubSpot, Notion, Slack |
| Slack Sender | Baxter (`$BAXTER_TOKEN`) | Slack MCP |
| Notion Projects DB | `15456cd2373b82e2bca10190134ace79` | `15456cd2373b82e2bca10190134ace79` |

## Recreating This Routine

1. Go to [claude.ai/code/routines](https://claude.ai/code/routines) and create a new routine
2. Set the schedule to `0 13 * * 1-5`
3. Attach the **HubSpot** and **Notion** MCP connectors
   - Baxter variant: add `BAXTER_TOKEN` as an environment variable
   - MCP variant: also attach the **Slack** MCP connector
4. Paste the prompt from `hubspot-event-project-creator-baxter.md` or `hubspot-event-project-creator.md` as the agent instructions
