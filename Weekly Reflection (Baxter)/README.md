# Baxter weekly reflection — Slack and OpenAI
Updated: 2026-10-11

## Current status
The Slack-hosted application update has been deployed. A restricted live DM pilot previously verified incoming Slack message → OpenAI Managed Agent → Baxter bot reply.
The hosted administration check now verifies Baxter's bot identity, the internal participant roster and datastore configuration. Slack workflow tokens omit the optional bot_id field; the check verifies the known Baxter identity and workspace instead.
Team mode is enabled as of October 11, 2026. The hosted bot identity, participant roster, isolated session and thread listener, bot reply, long-pause resumption, managed-agent report generation, and Notion report write/readback checks passed. The temporary test report was archived and its listener removed.
The first team prompts are scheduled for October 16 at 2 p.m. Eastern. Collection closes October 19 at 9 a.m.; the report runs at 10 a.m. The weekly schedules were read back from Slack with America/New_York timezone.

This document supersedes the earlier two-routine Claude setup. The two existing weekly-reflection prompt files now contain retirement notices pointing here; do not activate their old schedules alongside this implementation.

## Weekly flow
- Friday 2 p.m., America/New_York: snapshot active internal teammates and send the reflection questions in individual Baxter DMs.
- On each reply in the reflection thread: immediately continue that participant's separate weekly conversation. One question at a time, at most three follow-ups, then a summary they can confirm or correct.
- Monday 9 a.m. Eastern: exclusive response cutoff; capture the recorded reflection threads.
- Monday 10 a.m. Eastern: generate the combined report in the Weekly Reflection Reports Notion table.

Use the IANA timezone so daylight-saving changes preserve local times. No email delivery is part of the selected flow.

## Questions
1. What took most of your time this week? Was it worth it?
2. Where did you feel real momentum — something that moved faster or better than expected?
3. Where did you feel stuck, spinning, or going in circles?
4. What pattern are you noticing — in your work, a client situation, or the team?
5. One thing you'd do differently next week.

## Participants and trust
Include active internal members, including founders and the workflow owner. Exclude bots, deleted accounts, apps, guests and service accounts.
The invitation discloses that the workflow owner receives named summaries and team patterns. Nonresponse is not an employee performance measure.
Voice notes require a short text summary; automatic audio transcription is not implemented.

## Architecture
Slack hosts event reception, durable workflow state and scheduling. OpenAI Managed Agents hosts conversation execution. Notion holds the combined report.
Use Baxter bot authorization only. Personal Slack OAuth and personal Slack MCP are excluded. Each participant/week has a separate session and authorized thread.
The Slack relay checks workspace, participant, channel, thread and cutoff before handing off input. Agent instructions restrict outbound replies to the same thread; the hosted synthetic check verified that behavior.
After a long pause, a new hosted sandbox can restore context from that participant's recorded thread. No conversation polling timer is used.

## Report
Separate confirmed, unconfirmed, partial, voice-review, no-response and collection-failed statuses. A failed read is never interpreted as silence.
Shared patterns require at least two people's evidence; otherwise label an individual signal. Include momentum, blockers, coordination, AI and offering hypotheses, named summaries, next-week intentions and participation.
For each opportunity include evidence, confidence, potential impact, a next experiment, suggested owner and success measure. Keep observations, inferred causes and hypotheses distinct. Do not invent savings or create tasks automatically.
Prior comparison uses up to four completed cycles saved by this hosted workflow; mark comparison unavailable if none exist.

## State and retries
Persist the Friday roster, per-person DM/root/session mappings, captured reflection messages and report status in the Slack datastore.
Reconcile prompt metadata before sending again; stop on ambiguous delivery rather than blindly retrying.
Use stable OpenAI event idempotency keys. Recover replies posted while provisioning a conversation.
Query Notion by week before creating a row; stop on duplicates. Update a dedicated managed report section, preserving unrelated content. Mark completed only after reading back the report and properties.

## Configuration and activation
Required hosted secrets: OPENAI_API_KEY, OPENAI_SESSION_ID (configuration source), and NOTION_API_TOKEN.
Keep secrets in the host's secret store; never place them in GitHub, prompts, logs or command arguments.
Share only the Reports table with the dedicated Notion integration. A chat connector does not automatically authorize the hosted bot.
Additional bot scopes: datastore:read, datastore:write, triggers:write. Outbound domains: api.openai.com and api.notion.com. Conversation sandbox network: slack.com only.
Keep TEAM_ENABLED false until identity/roster, credentials, listener creation, isolated replies, long-pause resumption and a controlled report write/readback pass.
Disable the broad pilot listener before enabling team routing. Create exactly one Friday, Monday collection and Monday report schedule and retain their returned IDs.
To stop the rollout, set TEAM_ENABLED false; keep older sender/polling/report routines paused.

## Validation
Fourteen automated tests passed for identity/conversation boundaries, errors, local time and DST, roster exclusions, event idempotency, prompt recovery, pagination, cutoff/late edits, duplicate report rows, retry behavior and verified completion.
Slack manifest validation required unique workflow and function callback IDs and nonempty administrative trigger values; these were corrected during deployment.
The report-analysis session supplies its evidence as initial input at creation, as required by conversation-only managed-agent sessions. A regression test verifies that the evidence is submitted once. Workflow-token identity checks verify the known Baxter user and workspace rather than requiring the optional bot_id field.
The old broad DM pilot listener was removed and its feature flag disabled before team mode was enabled.

## Repository scope
This repository is public. It contains sanitized operating notes only: no tokens, internal workspace/channel/session IDs, participant transcripts or private Notion links. Account-specific configuration and implementation are retained in the authorized operational workspace.

