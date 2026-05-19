# Update Existing Notion Page From HubSpot

Use `hubspot-update-notion-stage.js` for a second HubSpot custom code action. This workflow updates an existing Notion page when a HubSpot deal moves to a later stage, such as `Proposal`.

This file does **not** create a new Notion page. It updates the page that was already created by the first workflow.

## What This Workflow Updates

Currently, the code updates this Notion field:

```txt
Deal Stage
```

Example:

```txt
HubSpot deal stage: Proposal
Notion Deal Stage: Proposal
```

## Required Setup Before This Workflow

The first workflow must save the created Notion page ID back onto the HubSpot deal.

Create a HubSpot deal property:

```txt
Notion Page ID
```

Recommended type:

```txt
Single-line text
```

In the first workflow, after the create-Notion-page custom code action, add a HubSpot action:

```txt
Set deal property Notion Page ID = notionPageId
```

`notionPageId` is the output from the first custom code action.

## Workflow Trigger

Create a second deal-based workflow.

Recommended enrollment criteria:

```txt
Deal stage is Proposal
AND Notion Page ID is known
```

Keep re-enrollment off at first unless you intentionally want the same deal to update Notion multiple times.

## Custom Code Secrets

Add these secrets to the custom code action:

```txt
NOTION_API_KEY
NOTION_DATABASE_ID
```

Use the same values from the first workflow.

## Properties To Include In Code

Add these rows under HubSpot's `Properties to include in code` section:

| Variable ID | HubSpot property |
| --- | --- |
| `notion_page_id` | Notion Page ID |

The code also accepts `notion_page_ID` because HubSpot currently sent that casing in testing. Lowercase `notion_page_id` is still recommended.

This workflow defaults the Notion `Deal Stage` value to:

```txt
Proposal
```

That avoids accidentally writing the previous HubSpot stage, such as `Appointment Scheduled`, when the HubSpot test payload still contains an older deal-stage value.

If you want to override the default later, add either:

| Variable ID | Value |
| --- | --- |
| `target_deal_stage` | The exact stage to write to Notion |

or a secret:

```txt
TARGET_DEAL_STAGE
```

## Code To Paste

Paste the full contents of:

```txt
hubspot-update-notion-stage.js
```

Only paste the JavaScript code. Do not paste Markdown fences, this README text, or the filename into HubSpot's code editor.

The first line should be:

```js
const axios = require("axios");
```

## Optional Data Outputs

You can add these HubSpot data outputs:

| Output Name | Type |
| --- | --- |
| `updatedNotionPageId` | String |
| `updatedDealStage` | String |

These outputs are useful for debugging, but they are not required for the update to work.

## Troubleshooting

If you see this error:

```txt
Missing required HubSpot input field: notion_page_id
```

Check that:

- The HubSpot deal has `Notion Page ID` filled in.
- The custom code action includes `notion_page_id` under `Properties to include in code`.
- `notion_page_id` maps to the HubSpot deal property `Notion Page ID`.
- The workflow trigger includes `Notion Page ID is known`.

If you see a syntax error like:

```txt
Unexpected token
```

Delete everything in the HubSpot code editor and paste only the contents of `hubspot-update-notion-stage.js`.

If Notion says it cannot find the page, confirm that `Notion Page ID` stores the raw Notion page ID returned by the first workflow's `notionPageId` output.

## Local Syntax Check

From this project folder, run:

```bash
node --check hubspot-update-notion-stage.js
```
