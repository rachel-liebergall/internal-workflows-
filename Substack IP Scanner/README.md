# Substack IP Scanner

Scan Jess Von Bank's and Jason Averbook's Substacks each **Monday at 9 a.m. Eastern** and add useful takeaways, next steps, and potential offering opportunities to **Substack Action Items & Takeaways** in **Operations → Knowledge Library**.

## Current status

As of October 14, 2026, a Codex automation is active in the scanner chat. Its first automatic run is scheduled for **October 19, 2026, at 9 a.m. Eastern**. “Pending” means that the first scheduled run has not occurred. It does not mean the automation is disabled.

Both RSS feeds were fetched and parsed successfully, and the Notion destination schema and existing entries were inspected. No end-to-end scheduled Notion write has been verified yet. Updating these repository files does not deploy or alter a separate Claude routine.

The earlier README described a Friday Claude routine with Slack notifications. Its current deployment status has not been verified. Check that runtime and pause its scanner schedule if it is still active before relying on the Monday automation as the sole writer. See [RUNBOOK.md](RUNBOOK.md).

## Weekly behavior

1. Fetch both feeds and read new article text.
2. Cover the previous 14 days on the first run; subsequently use per-author successful checkpoints with a 14-day overlap.
3. Compare canonical links, authors, and item substance against existing Notion rows.
4. Add one primary takeaway and up to two distinct useful actions per new article.
5. Map to the existing database fields and verify saved rows.
6. Report additions or failures in the scanner chat; stay quiet when nothing changed.

Existing statuses and human edits are preserved. Unavailable article text produces an explicitly limited Tracking Note rather than a guessed analysis. Podcast entries are analyzed from accessible text unless audio or a transcript is actually read.

## Sources

| Author | RSS | Archive |
| --- | --- | --- |
| Jess | https://jessvonbank.substack.com/feed | https://jessvonbank.substack.com/archive |
| Jason | https://jasonaverbook.substack.com/feed | https://jasonaverbook.substack.com/archive |

The legacy Now of Work feed and LinkedIn scraping are outside this weekly workflow.

## Files

| File | Purpose |
| --- | --- |
| [substack-ip-scanner.md](substack-ip-scanner.md) | Reusable scanner instructions |
| [FIELD_MAPPING.md](FIELD_MAPPING.md) | Notion properties, classifications, and payload shape |
| [RUNBOOK.md](RUNBOOK.md) | Setup, validation, recovery, schedule handoff, and maintenance |

## Configuration and repository scope

Use a timezone-aware Monday 09:00 schedule in `America/New_York`, a Notion connection with access to the destination, and a network tool that can retrieve XML. The runtime privately supplies the destination database and data source IDs. Notion stores the takeaways; private runtime state stores checkpoints and retries.

This is an agent-instruction workflow, not a standalone application or a GitHub Actions deployment. The repository is public: keep credentials, private Notion links, operational identifiers, article bodies, and run logs in the authorized runtime. GitHub changes are reviewed independently from scheduler activation.
