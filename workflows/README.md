# HubSpot Custom Code Action for Notion

This project is now set up for **HubSpot Custom code**, not Netlify or Vercel.

The workflow action creates a new page in your Notion `Sales Opportunities` database and returns the created Notion page URL as a HubSpot workflow output.

The code fetches the deal's associated contact and company directly from HubSpot, so you do not need to duplicate contact or company data onto the deal.

## What You Already Have

This guide assumes:

- Your Notion database already exists.
- Your Notion integration already has access to the database.
- Your HubSpot account has workflow `Custom code` actions.

Your Notion database should have these exact fields:

| Notion Property | Type |
| --- | --- |
| Opportunity | Title or Text |
| Company | Title or Text |
| Contact Name | Text |
| Deal Stage | Select |
| Meeting Date | Date |
| Service Type | Select or Multi-select |
| Opportunity Owner | Select, Multi-select, or People with user ID mapping |
| HubSpot URL | URL |

The code reads your Notion database schema first, so fields like `Company`, `Service Type`, and `Opportunity Owner` can use the compatible Notion field types listed above.

The code also formats HubSpot deal stage values for Notion. For example, HubSpot's internal value `appointmentscheduled` becomes `Appointment Scheduled`.

Meeting dates are sent to Notion as date-only values, like `2026-05-14`, so Notion does not shift the date because of time zones.

The code maps HubSpot's deal name to Notion's `Opportunity` field. It also maps service type into one of these Notion `Service Type` options:

- `The Room`
- `The Signal`
- `The Build`
- `General`

The code maps HubSpot's `Opportunity Owner(s)` deal property to Notion's `Opportunity Owner` field:

- `Rachel`
- `Jason`
- `Jess`

Because `Opportunity Owner` is a Notion People field, Notion requires internal Notion user IDs instead of names. Add those IDs in the `NOTION_USER_IDS_BY_OWNER_NAME` secret.

## Next Steps

1. Open your HubSpot workflow.
2. Add a `Custom code` action.
3. Add three HubSpot secrets.
4. Add five HubSpot input fields.
5. Paste the code from `hubspot-custom-code.js`.
6. Add two data outputs.
7. Test the action.
8. Turn on the workflow.

## 1. Add the Custom Code Action

In HubSpot:

1. Go to `Automation` -> `Workflows`.
2. Open the workflow that should create the Notion opportunity.
3. Click `+` to add an action.
4. Search for `Custom code`.
5. Choose `Custom code`.
6. Set the language to `Node.js`.

## 2. Add Secrets

In the custom code action, add these secrets:

```txt
NOTION_API_KEY
NOTION_DATABASE_ID
HUBSPOT_PRIVATE_APP_TOKEN
NOTION_USER_IDS_BY_OWNER_NAME
```

Use these values:

- `NOTION_API_KEY`: your Notion integration token.
- `NOTION_DATABASE_ID`: the ID of your `Sales Opportunities` database.
- `HUBSPOT_PRIVATE_APP_TOKEN`: a HubSpot private app token that can read deals, contacts, and companies.
- `NOTION_USER_IDS_BY_OWNER_NAME`: JSON that maps owner names from HubSpot to Notion user IDs.

The database ID should be only the long ID, not the whole Notion URL. For example, if your copied Notion link looks like this:

```txt
https://www.notion.so/workspace/df41cc7bff8c46cfbe2865b49a365ad2?v=b929...
```

Use this part:

```txt
df41cc7bff8c46cfbe2865b49a365ad2
```

The code also tries to clean this up automatically if you accidentally paste the full URL.

The code reads these secrets with:

```js
process.env.NOTION_API_KEY
process.env.NOTION_DATABASE_ID
process.env.HUBSPOT_PRIVATE_APP_TOKEN
process.env.NOTION_USER_IDS_BY_OWNER_NAME
```

Use this JSON format for `NOTION_USER_IDS_BY_OWNER_NAME`:

```json
{
  "Rachel": "notion-user-id-for-rachel",
  "Jason": "notion-user-id-for-jason",
  "Jess": "notion-user-id-for-jess"
}
```

### Create the HubSpot Private App Token

In HubSpot:

1. Go to `Settings`.
2. Go to `Integrations` -> `Private Apps`.
3. Create a private app.
4. Add read scopes for CRM deals, contacts, and companies.
5. Copy the private app access token.
6. Add it to the custom code action secrets as:

```txt
HUBSPOT_PRIVATE_APP_TOKEN
```

## 3. Add HubSpot Input Fields

In `Properties to include in code`, add the HubSpot properties you want to send to Notion.

Use these exact variable names:

| Variable ID in HubSpot | What it should contain |
| --- | --- |
| `deal_name` | Deal name |
| `deal_stage` | Deal stage |
| `meeting_date` | Meeting date |
| `service_type` | Service type |
| `opportunity_owners` | Opportunity Owner(s) |

The code reads them from:

```js
event.inputFields.deal_name
event.inputFields.deal_stage
event.inputFields.meeting_date
event.inputFields.service_type
event.inputFields.opportunity_owners
```

The code fetches the associated contact's first and last name from HubSpot and combines them into the Notion `Contact Name` field.

The code fetches the associated company's name from HubSpot and maps it to the Notion `Company` field.

The code maps `deal_name` to the Notion `Opportunity` field.

The `service_type` input should come from a HubSpot deal property if you have one. If it is blank, the code uses `General`.

The `opportunity_owners` input should use a HubSpot deal property named something like `Opportunity Owner(s)`.

You do not need to add a `hubspot_url` input. HubSpot custom code automatically receives the enrolled record ID, object type, and portal ID. The code uses those values to build the HubSpot record URL.

You also do not need to add `company_name`, `firstname`, or `lastname` inputs anymore. The code fetches those from the deal's associated company/contact.

## 4. Paste the Code

Copy the full contents of:

```txt
hubspot-custom-code.js
```

Paste it into the HubSpot custom code editor.

Only paste the JavaScript code. Do not paste Markdown fences like ```js, the file name, setup instructions, secrets, or data output names into the code editor.

HubSpot already supports `axios`, so you do not need to install packages inside HubSpot.

## 5. Add Data Outputs

In the HubSpot custom code action, add these data outputs:

| Output Name | Type |
| --- | --- |
| `notionPageUrl` | String |
| `notionPageId` | String |

The workflow can use `notionPageUrl` in later actions, such as sending an internal notification or updating a HubSpot property.

## 6. Test the Action

Before turning on the workflow:

1. Click `Test action`.
2. Choose a test record.
3. Run the test.
4. Confirm that HubSpot shows a `notionPageUrl` output.
5. Open Notion and confirm that a new page was created.

Successful output should include:

```json
{
  "notionPageUrl": "https://www.notion.so/...",
  "notionPageId": "..."
}
```

## Troubleshooting

If the action fails, check the HubSpot action logs.

Common issues:

- Syntax error like `Unexpected token ':'`: the code editor probably contains non-JavaScript text. Delete everything in the editor and paste only the contents of `hubspot-custom-code.js`.
- Secret name typo: the names must be `NOTION_API_KEY` and `NOTION_DATABASE_ID`.
- Missing HubSpot private app token: add `HUBSPOT_PRIVATE_APP_TOKEN` as a custom code secret.
- Input variable typo: the variable IDs must match the table above.
- Association issue: the deal must have an associated contact and associated company.
- Notion field name typo: Notion property names must match exactly.
- Service type option mismatch: Notion should have `The Room`, `The Signal`, `The Build`, and `General` as `Service Type` options.
- Opportunity owner option mismatch: Notion should have `Rachel`, `Jason`, and `Jess` as `Opportunity Owner` options.
- Integration access issue: your Notion integration must be connected to the database.
- Date issue: `meeting_date` must be a valid date or date-time value.

## Local Syntax Check

This code is meant to run inside HubSpot, but you can still check the JavaScript syntax locally:

```bash
npm run check
```

## Files

- `hubspot-custom-code.js` is the code to paste into HubSpot.
- `README.md` lists the HubSpot setup steps.
- `package.json` only exists for local syntax checking.
