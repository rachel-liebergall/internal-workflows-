# Sync Core Deal Fields to Notion

Use `hubspot-sync-notion-fields.js` in a HubSpot custom code action to keep an existing Notion page up to date whenever core deal fields change.

This workflow does **not** create Notion pages. It updates a page that was already created by the first workflow (Initial Meeting Scheduled).

## What This Workflow Syncs

| HubSpot Field | Notion Property | Notes |
| --- | --- | --- |
| Deal Name | Name | Page title |
| Deal Stage | Deal Stage | Mapped to human-readable label |
| Description | Description | Plain text |
| Initial Meeting Date | Initial Meeting Date | Date |
| Associated Contacts | Contacts | Fetched via HubSpot API; comma-separated names |

Notion property names are set in the `NOTION_PROPS` block at the top of the script. Update them there if your database uses different names.

## Prerequisite

The first workflow (Initial Meeting Scheduled) must save the created Notion page ID back onto the HubSpot deal as a deal property:

```txt
Notion Page ID
```

This workflow reads that value to know which page to update.

## Workflow Trigger

Create a deal-based workflow with re-enrollment **on**.

Recommended enrollment criteria — any of the following properties change:

```txt
Deal Name
Deal Stage
Description
Initial Meeting Date
```

With the filter:

```txt
Notion Page ID is known
```

Re-enrollment on ensures the workflow fires each time a tracked field changes, not just once.

## Custom Code Secrets

Add these secrets to the custom code action:

```txt
NOTION_API_KEY
NOTION_DATABASE_ID
HUBSPOT_PRIVATE_APP_TOKEN
```

`NOTION_API_KEY` and `NOTION_DATABASE_ID` are the same values used in the first workflow.

`HUBSPOT_PRIVATE_APP_TOKEN` is required to fetch associated contacts. Create a private app in HubSpot under **Settings → Integrations → Private Apps** with the `crm.objects.contacts.read` and `crm.objects.deals.read` scopes.

If `HUBSPOT_PRIVATE_APP_TOKEN` is not set, the workflow skips the contacts sync and updates the remaining fields normally.

## Properties To Include In Code

Add these rows under HubSpot's `Properties to include in code` section:

| Variable ID | HubSpot Property |
| --- | --- |
| `notion_page_id` | Notion Page ID |
| `dealname` | Deal Name |
| `dealstage` | Deal Stage |
| `description` | Description |
| `initial_meeting_date` | [your initial meeting date property] |

Replace `[your initial meeting date property]` with the internal name of your HubSpot deal property for the initial meeting date.

## Code To Paste

Paste the full contents of:

```txt
hubspot-sync-notion-fields.js
```

Only paste the JavaScript. Do not paste Markdown fences, this README text, or the filename.

The first line should be:

```js
const axios = require("axios");
```

## Data Outputs

You can add these HubSpot data outputs for debugging:

| Output Name | Type |
| --- | --- |
| `updatedNotionPageId` | String |
| `updatedFields` | String |

`updatedFields` lists the Notion properties that were written in that run, for example:

```txt
Name, Deal Stage, Contacts
```

## Adjusting Notion Property Names

If your Notion database uses different property names, update the `NOTION_PROPS` block near the top of the script:

```js
const NOTION_PROPS = {
  name: "Name",
  dealStage: "Deal Stage",
  description: "Description",
  initialMeetingDate: "Initial Meeting Date",
  contacts: "Contacts",
};
```

The script reads your Notion database schema at runtime, so it handles `select`, `status`, `rich_text`, `multi_select`, and `date` property types automatically.

## Troubleshooting

**`Missing notion_page_id`**
- Confirm the HubSpot deal has `Notion Page ID` filled in.
- Confirm `notion_page_id` is mapped to `Notion Page ID` under `Properties to include in code`.
- Confirm the workflow filter includes `Notion Page ID is known`.

**`Notion database is missing property "X"`**
- The property name in `NOTION_PROPS` does not match a property in your Notion database. Check for extra spaces or capitalization differences.

**Contacts not updating**
- Confirm `HUBSPOT_PRIVATE_APP_TOKEN` is set as a secret.
- Confirm the private app has `crm.objects.contacts.read` and `crm.objects.deals.read` scopes.
- Check the custom code logs for a `Could not fetch contacts` warning.

**Date not updating**
- HubSpot sends dates as millisecond timestamps or ISO strings. Both are handled. If the field is blank in Notion, confirm the variable ID in `Properties to include in code` matches the internal HubSpot property name exactly.

## Local Syntax Check

From this project folder, run:

```bash
node --check hubspot-sync-notion-fields.js
```
