# Baxter Slack app source

Run commands from this directory. Use the Slack CLI and Deno with the pinned SDK
imports in `deno.jsonc`.

## Configuration

Copy `deployment.example.json` to `deployment.local.json`. The latter is ignored
by Git. Replace the example identifiers with the authorized deployment's actual
identifiers before using the Slack CLI against production. Preserve the existing
datastore names and callback IDs when updating an existing app.

| Configuration                           | Purpose                                                                        |
| --------------------------------------- | ------------------------------------------------------------------------------ |
| teamId                                  | Authorized Slack workspace                                                     |
| pilotUserId / pilotChannelId            | Restricted legacy pilot and operator test conversation                         |
| botUserId / botId                       | Baxter bot identity checks                                                     |
| excludedUserId                          | Service account excluded from the reflection roster                            |
| openaiProjectId                         | OpenAI project for agent requests                                              |
| reportsDataSourceId / reportsDatabaseId | Weekly reflection Notion destination                                           |
| vendorsDataSourceId / vendorsDatabaseId | Vendor Perspectives Notion destination                                         |
| ntnDataSourceId / ntnDatabaseId         | NTN Quotable Insights Notion destination                                       |
| excludedVaultId1 / excludedVaultId2     | Vaults excluded when deriving reflection configuration from its source session |

The example identifiers are synthetic. The tests import the same configuration
and use mocked APIs. Do not put tokens in either JSON file.

Configure hosted variables securely in the existing Slack app:

- `OPENAI_API_KEY`
- `OPENAI_SESSION_ID`: existing authorized source session for reflection model,
  instructions and bot-only vault configuration.
- `NOTION_API_TOKEN`: dedicated Notion integration shared with the destination
  databases.
- `TEAM_ENABLED`: explicit `true` enables weekly team workflow operations.
- `VENDOR_CAPTURE_ENABLED`: explicit `true` enables vendor capture.
- `NTN_CAPTURE_ENABLED`: explicit `true` enables NTN insight capture.
- `PILOT_ENABLED`: keep `false` for normal team operation.

`.env.example` lists variable names only. In the verified operational
environment, `slack env set` affected local `.env`; hosted variables were
configured through `apps.hosted.variables.add`. Verify flags from hosted runtime
output rather than assuming a local file updates the deployed app. Never commit
hosted credentials, `.env`, `.slack/apps.json`, `.slack/config.json`, credential
stores or real message replay files.

## Check locally

```sh
cp deployment.example.json deployment.local.json
# Keep the synthetic example configuration for these mocked tests.
deno test functions/relay_test.ts functions/team_test.ts lib/notion_test.ts lib/vendor_test.ts lib/ntn_test.ts
deno check manifest.ts functions/*.ts workflows/*.ts triggers/*.ts lib/*.ts datastores/*.ts
deno lint
deno fmt --check
```

30 tests cover reflection routing, DST/cutoff, roster exclusions, retries,
pagination, report completion, vendor matching, evidence validation, isolated
analysis, destination schema checks, write readback and uncertain-write
reconciliation. Tests are not live deployment validation.

## Deploy and activate

For an existing installation, restore its private identifiers and use the Slack
CLI's app selection to link this source to **that existing app**. Do not create
a second Baxter or duplicate schedules. The tracked `.slack/hooks.json` supplies
the Deno Slack hooks; app linkage stays local.

1. Keep relevant hosted feature flags disabled during initial configuration and
   validation.
2. Run `slack manifest validate` and `slack deploy` against the intended app.
   Review scope/installation prompts. Deploying source does not itself create
   trigger definitions.
3. Use `triggers/inspect.ts` to derive the reflection configuration from the
   authorized source session. It pins the bot/workspace and filters excluded
   vaults. Inspect its output privately: it contains internal
   roster/configuration metadata.
4. Run controlled checks as appropriate. `vendor_verify.ts` is schema-read-only;
   `vendor_verify_write.ts` creates, reads and archives an explicitly synthetic
   row. Reflection `verify_notion.ts` also creates and archives a synthetic row.
   `verify_runtime.ts` and `verify_report.ts` exercise isolated synthetic
   sessions. `test_dm.ts`, `recover_test_dm.ts` and `rachel_dm.ts` can interact
   with the configured pilot DM; use only when the recipient has authorized the
   test.
5. For reflections, create exactly one trigger each from `friday.ts`,
   `monday_collection.ts` and `monday_report.ts`, then enable team mode after
   live routing and report checks. Keep the broad legacy pilot disabled.
   Existing active deployments already have these schedules.
6. For vendors, enable the hosted vendor flag and create exactly one event
   trigger from `vendor_capture.ts`. Invite Baxter into each intended channel.
   `vendor_coverage.ts` logs membership; `vendor_join_public.ts` joins visible
   ordinary public channels and must be used only for an authorized all-channel
   rollout. It does not join hidden private channels or Slack Connect channels.
7. Read back trigger configuration, inspect hosted activity and verify
   destination results. Preserve trigger IDs in private operating records.

Example trigger creation, after selecting the correct app:

```sh
slack trigger create --trigger-def triggers/vendor_capture.ts
```

Do not recreate existing triggers simply because the source has been cloned.
Existing reflection sessions/state and hosted secrets are not reconstructed from
this repository alone. The code uses OpenAI managed-agent endpoints and the
existing provisioned session/vault setup; an unrelated API key alone is
insufficient.

## Source map

- `manifest.ts`, `baxter-original.json`: Slack app functions, workflows,
  datastores, bot scopes and network domains. The original manifest is an input;
  `manifest.ts` explicitly emits bot-only OAuth scopes and disables MCP.
- `functions/maintenance.ts`, `lib/cycle.ts`: weekly start, dispatch, collect
  and report operations.
- `functions/team_reply.ts`, `lib/dm_trigger.ts`: participant/week message
  routing and replacement sessions after inactivity.
- `lib/prompts.ts`: reflection questions, conversation rules and report
  instructions.
- `lib/common.ts`, `lib/notion.ts`: shared Slack/OpenAI helpers and verified
  report persistence.
- `functions/vendor_capture.ts`, `lib/vendor_capture.ts`: candidate intake, job
  state, isolated analysis and scheduled completion.
- `lib/vendor_rules.ts`, `lib/vendor_notion.ts`: vendor matching,
  exact-substring evidence checks, schema validation, source keys and verified
  writes.
- `datastores/`: independent reflection, vendor and NTN state.
- `workflows/`, `triggers/`: workflow inputs, event routing, recurring schedules
  and explicit operational checks.

## Destination fields

Vendor Perspectives requires `Insight` (title), `Vendor`, `Takeaway`,
`Source Details`, `Insight Key` (rich text), `Type` (Announcement / Vendor claim
/ Team perspective), `Source` (Slack / Granola), `Source Link` (URL),
`Source Date` and `Captured On` (date). The vendor function validates the schema
before processing. Slack rows use stable keys
`slack:channel:message-ts:baxter-N` and the original message permalink.

The reflection code expects `Name`, `Week Of`, `Response Rate`,
`Shared Patterns`, `What's Working`, `Friction & Blockers`, `Overlapping Work`,
`AI Opportunity Signals`, `New Offering Signals`, `Non-Responders` and
`Voice Responses`; see `lib/notion.ts` for field validation and the managed
report section. Share both destinations with the dedicated integration; chat
connector access does not grant hosted-token access.

## Pause and recover

Disable the appropriate **hosted** feature flag to pause a capability. Delete
only the vendor event trigger to stop incoming vendor events without affecting
reflections; an already queued completion may still run unless its flag is
disabled. Pause the separate daily Codex automation separately to stop all
vendor ingestion. Registry status alone does not stop the event listener.

Inspect Slack activity and datastore state before retries. Completed jobs skip
new analysis; uncertain writes query the stable key before creating again.
Failed or stalled jobs may need explicit recovery. Do not claim exactly-once
delivery, silently drop unfinished candidates or overwrite human-edited Notion
rows.

## NTN quotable insight capture

Share the NTN destination with the same dedicated Notion integration. A chat
connector grant does not grant the hosted app access.

Before activation, run `triggers/ntn_verify.ts` (read-only schema check) and
`triggers/ntn_verify_write.ts` (temporary synthetic create/read/archive).
Validate an authorized genuine source without posting Slack test messages. Only
then enable the hosted NTN flag and create exactly one event trigger from
`triggers/ntn_capture.ts`. `ntn_coverage.ts` reports channel membership. Leave
vendor and reflection flags and triggers unchanged.

Required fields are checked by `lib/ntn_notion.ts`: Insight, NTN Wording, NTN
Author, Insight Type, Wording Type, Research / Thought / Evidence, Client
Application, Citations, Original Source, Evidence Type, Reuse Status,
Limitations, Research Next Step, Source Date, Captured On and Insight Key. Use
the existing select options in the destination.

The model extracts original NTN thinking into a sanitized synthesis. It must
declare ownership and safe reuse; validators require an exact supporting source
substring and the supplied author. Evidence excerpts remain internal to
validation and are never copied into the shared Notion body. This guards
provenance and formatting, not truth or empirical validation. New live rows are
Practitioner observation / Needs verification. The live extractor cannot create
an NTN original research classification or claim a completed study.

Stable keys use `ntn:slack:channel:message-ts:baxter-N`. Reconciliation must
compare original source IDs and claim meaning against all prior rows, not just
literal keys. Notion does not provide an atomic uniqueness constraint.

Pause only NTN by disabling its hosted flag or removing only its event trigger.
Pause its separate Monday/Wednesday/Friday reconciliation independently if
stopping the whole workflow. Registry status alone does not disable an event
listener. Retain failed jobs and inspect state before retrying.
