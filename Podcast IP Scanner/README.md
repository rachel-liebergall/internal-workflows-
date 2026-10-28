# Podcast IP Scanner

Captures reusable insights from **Now to Next: The Signal** and **The Edge of Now** in the Notion Knowledge Library.

## Team workflow
- [Podcasts data capture — canonical runbook](https://app.notion.com/p/3f956cd2373b806aac64d7ae09ee7487)
- Registry: Operations → Automated Team Workflows & Processes.
- [Knowledge output](https://app.notion.com/p/7f19489fb05346a7be65db80d6871120): Operations → Knowledge Library → Podcast Action Items & Takeaways.
- Owner: unassigned; this documentation does not assign an owner.
- Registry status: Active. First scheduled scan is pending; setup verified two initial records, one per show.

## What it does
1. Reads both Notion episode trackers and discovers newly published/completed material.
2. Reads transcripts or episode notes, labels evidence quality, and deduplicates by episode identity and canonical source.
3. Creates one knowledge record per episode with 3–5 supported insights, concrete suggested next steps, and proposed Now to Next applications.
4. Links verified matches in Substack Action Items & Takeaways, preserving both source records.
5. Reads back writes and records meaningful outcomes or failures in the runbook's Run log.

Proposed next steps are not assigned tasks. Human edits and statuses are preserved.

## Schedule and deployment
- Mondays, 9 a.m. America/New_York, following daylight-saving time.
- Active executor: Codex thread heartbeat.
- Automation ID: `weekly-podcast-insights-signal-edge-of-now`.
- Thread ID: `01a13b31-99b1-7181-9a5e-d2d8b29ac025`.
- The Notion registry and this repo document the workflow; they do not execute it.
- Do not create a parallel Claude routine or GitHub Actions schedule.
- Initial schedule date: October 19, 2026. Setup captures are not a full historical backfill.

## Sources
| Show | Notion data source |
| --- | --- |
| Now to Next: The Signal | `49de7adb-ce92-4e49-a0b7-2bc7486474a8` |
| The Edge of Now | `8cb9bacf-49c2-4f18-a4d1-3976cd352668` |

Destination data source: `278b557f-4dec-4647-b523-f7fd09b72c35`.
Related Substack data source: `d647ecde-3045-4304-a568-b22a77ce825c`.

Fetch live schemas before every run. Do not assume tracker Date is public release date. Signal has a Published status; Edge has no publication-status property. Ignore templates, blank placeholders, pre-calls, and incomplete recordings.

The legacy Signal website showed earlier-season content during setup; the Edge public directory could not be read with the web reader. Notion episode notes provide a fallback. Do not claim audio or transcripts were reviewed when only notes were read.

## Record mapping
| Property | Rule |
| --- | --- |
| Episode / Show | Verified episode title; exact existing Show option |
| Hosts / Guests | Verified identities and roles |
| Episode Date | Verified public release date, otherwise unset |
| Source Link | Canonical full-episode URL; Notion source if no verified public link |
| Episode Key | `signal:notion:<page-id-without-dashes>` or `edge:notion:<page-id-without-dashes>` |
| Summary / Key Takeaways | Faithful synthesis; fewer than five insights if source is limited |
| Next Step / Offering Opportunity | Explicitly proposed; no invented owner or deadline |
| Opportunity Size | High, Medium, Low, or None - Reinforces Existing |
| Evidence Quality | Transcript, Show notes, or Limited access |
| Status | Not started for new captures |
| Captured On | Run date in America/New_York |
| Related Substack Takeaways | One-way relation to supported existing matches |

Views: **By Show** and **Needs Action**.

## Coordination with Substack
Both scans start Monday at 9 a.m.; completion order is not guaranteed. Podcast capture does not wait for the Substack run. Recheck previously empty relations on later runs, preserve existing links, and add only inspected matches. Missing optional links do not make capture fail.

## Recovery and monitoring
- Use a 14-day overlap from the last successful scan; first scan uses the previous 14 days.
- Retain unresolved retries even after they fall outside the overlap.
- Read back uncertain writes before retrying; normalize canonical media IDs, tracking parameters, and Markdown escaping.
- Log meaningful changes/failures to the Notion runbook with run ID, time, per-show counts, links, checkpoint, and unresolved retries. Do not copy knowledge content into the log.
- Stay quiet on unchanged scans. No Slack/email is configured.
- Manage the actual schedule in Codex. Archived/Not Started registry status makes the runner skip writes but does not disable its trigger.
- Manual rerun: ask in the original podcast chat to run using the canonical runbook and existing duplicate checks.
- Migration: pause the existing scheduler first, preserve checkpoint/retry state, then configure and verify one replacement. Do not claim a scheduler migration just because prompt files were copied.

## Files and change control
- `podcast-ip-scanner.md`: snapshot of deployed runner instructions.
- The Notion runbook is the operational source of truth; this repo versions the prompt and setup.
- When instructions change, update the existing heartbeat via the app automation tool, mirror the prompt here, update the runbook, and verify the changed state.
- This is an agent workflow, not an executable application or deployed GitHub Action.

