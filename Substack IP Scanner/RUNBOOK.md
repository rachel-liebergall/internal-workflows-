# Substack scanner runbook

## Setup and scheduler handoff

1. Use the existing scanner chat and its Monday 09:00 America/New_York automation. Do not create another schedule for the same destination.
2. Supply the destination database privately, fetch its schema, and resolve the correct data source ID. Confirm the Notion connection can read the existing rows and create entries there.
3. Use [substack-ip-scanner.md](substack-ip-scanner.md) as the operational instructions, with private destination configuration. Keep durable per-author checkpoints and unresolved work in the runtime or persistent chat.
4. Inspect the previous Friday Claude routine. Its historic configuration does not establish whether it still runs. If active, pause that schedule when handing ownership to Monday's automation. Repository edits alone do not pause it.
5. If moving execution to another runtime, pause the current writer first, transfer its private checkpoints and unresolved candidates, then activate the replacement. Keep one scheduler responsible for writes.

Use a timezone-aware schedule. A fixed UTC hour will move relative to Eastern time across daylight saving changes. Read back the configured schedule after editing it. Runtime availability and unattended network permissions must be checked in that runtime; success in an interactive setup is not proof of unattended access.

## Verification before the first automatic run

- Fetch and parse both RSS feeds; confirm article links and timestamps.
- Inspect `content:encoded` and verify that the text is sufficient for analysis, or retrieve the article.
- Query the destination and compare current source URLs; follow all relevant pagination.
- Review a proposed item and its field mapping. Use a genuine missing item for an authorized live write; do not add synthetic examples to the production database.
- Verify write success and read back the row. Record which checks actually passed.

On October 14, feed parsing and database reads passed. A scheduled write has not yet been validated. The first automatic run is October 19 at 9 a.m. Eastern. A manual scan can be requested before Monday; it must perform the same duplicate checks and verification.

## Per-run state

Keep this state privately for each author:

- Last successful fixed run-start timestamp in UTC.
- Unresolved article URLs and source failures.
- Remaining candidate items for an interrupted multi-item article.
- Created row references needed to verify uncertain writes.

First run: previous 14 days. Later runs: last successful timestamp minus 14 days through the current fixed run-start timestamp. Notion remains the authoritative record of saved items. Overlap is intentional and must be deduplicated. After a long outage, inspect archives for posts outside the feed's retained range. Report a coverage gap if older posts cannot be checked.

Advance each author's checkpoint only after its feed/archive coverage is checked and all discovered posts are saved, explicitly logged with a content limitation, or confirmed already represented. A successful Jess scan must not erase a Jason failure. Without durable state, recover from a 14-day window plus existing Notion rows and disclose any older coverage uncertainty.

## Recovery

| Situation | Action |
| --- | --- |
| Web reader rejects XML | Use an XML-capable fetch tool and parse the RSS |
| One source fails | Process the other author, retain the failed checkpoint, and report the failure |
| Article is paywalled or incomplete | Save verified metadata as a limited Tracking Note; leave opportunities empty |
| A create times out | Query Notion for its candidate before retrying |
| Only some items were saved | Compare all intended candidates against saved rows and retry only missing items |
| Notion schema changes | Fetch the schema, surface incompatible fields/options, and retain unresolved work |
| No new posts | Finish quietly after a successful source check |
| Feed retention misses the window | Check archives or report the exact coverage limitation |
| Existing backfill needs enrichment | Leave it unchanged until an explicit enrichment request |

## Reporting and maintenance

Report additions by author, the configured database link, and the strongest one or two next steps in the scanner chat. Report failures and needed action. Do not send Slack or email messages as part of this workflow.

After changing instructions, update the runtime prompt as well as the repository documentation. GitHub is the reviewable instruction source; it does not automatically synchronize to a scheduler. Keep private runtime configuration out of commits. To stop future scans, pause the active automation in its scheduler.
