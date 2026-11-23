# Automated team workflow directory

Reviewed October 14, 2026 against the workflow READMEs in this repository and the Substack automation configured in this chat. This is a documentation inventory, not a live audit of every scheduler.

## Core team routines

| Workflow | Documented cadence | Output | Evidence / status |
| --- | --- | --- | --- |
| [Baxter weekly reflection](Weekly%20Reflection%20%28Baxter%29/README.md) | Friday 2 p.m. prompts; replies handled as they arrive; Monday 9 a.m. cutoff and 10 a.m. report | Individual Baxter conversations → Weekly Reflection Reports in Notion | October 11 README records team mode enabled and hosted validation passed. First team prompts scheduled October 16. Not rechecked live in this inventory. |
| [Daily task roundup](Daily%20Task%20Roundup/README.md) | Daily 9 a.m. EDT | Personalized tasks + external meetings Slack DM | Documented Claude routine; current enablement and recent runs unverified. |
| [EOD task check-in](EOD%20Task%20Check-In/README.md) | Weekdays 4 p.m. check-in; 7 p.m. updater, EDT | Baxter DMs → reply-based Notion status/comments → confirmation | Documented two-part routine; current enablement and recent runs unverified. |
| [AI Skill of the Week](AI%20Skill%20of%20the%20Week/README.md) | Monday 9 a.m. prep and 11 a.m. announcement; Wednesday 11 a.m. follow-up; Friday 4 p.m. closeout, EDT | Skill selection and review → team Slack thread → Notion lifecycle | README describes Rachel's Monday approval. Four routines documented; current enablement and approval behavior unverified. |
| [Expense reminder](Expense%20Reminder/README.md) | Monday and Friday 9 a.m. EDT | Baxter reminder DMs | Documented routine; current enablement and roster unverified. |
| [Daily News → Notion Sync](Daily%20News%20%E2%86%92%20Notion%20Sync/README.md) | Daily 4 p.m. ET | Daily-news and flagged Slack links → Team Context & Daily News | Documented routine; current enablement and recent runs unverified. |

## Meeting and knowledge workflows

| Workflow | Documented cadence | Output | Evidence / status |
| --- | --- | --- | --- |
| [Meeting preparation](Meeting%20Prep%20%E2%86%92%20Slack%20Notifications/README.md) | Hourly, weekdays 5 a.m.–5 p.m. EDT in Baxter variant | Upcoming external meetings → Notion prep guides and pre-meeting DMs | Multiple variants exist with differing day schedules; active variant unverified. |
| [Meeting capture](Meeting%20Capture%20%E2%86%92%20Notion%20Sync/README.md) | Every two hours, 7 a.m.–7 p.m. EDT | Completed Granola meetings → Team Granola Capture in Notion | Documented routine; current enablement and recent runs unverified. |
| [Substack IP Scanner](Substack%20IP%20Scanner/README.md) | Monday 9 a.m. America/New_York | Jess/Jason posts → Substack Action Items & Takeaways → scanner chat summary | Codex automation active as of October 14. RSS parsing and destination reads verified; first scheduled write pending October 19. Historic Friday Claude routine status unverified. |

Substack setup, field mapping, deduplication, and recovery are in its [runbook](Substack%20IP%20Scanner/RUNBOOK.md) and [field guide](Substack%20IP%20Scanner/FIELD_MAPPING.md).

## Sales, projects, and delivery

| Workflow | Documented cadence | Output | Evidence / status |
| --- | --- | --- | --- |
| [HubSpot deal signal scanner](HubSpot%20Deal%20Signal%20Scanner/README.md) | Tuesday and Friday 9 a.m. EDT | CRM activity signals → sales-tracking summary | Baxter and connector variants documented; active variant unverified. |
| [HubSpot deal creator from email](HubSpot%20Deal%20Creator%20from%20Email/README.md) | README lists weekdays 9 p.m., 10 a.m., and 2 p.m. EDT | Labeled Gmail → associated HubSpot deal → summary and processed label | Documented routine; live schedule unverified. UTC weekday boundaries should be checked against the intended evening schedule. |
| [HubSpot event project creator](HubSpot%20Event%20Project%20Creator/README.md) | Weekdays 9 a.m. EDT | Upcoming event deal → Notion project → CRM project link | Multiple variants documented; active variant unverified. |
| [Notion project / Drive sync](Notion%20Project%20Drive%20Sync/README.md) | Monday/Thursday 9 a.m. watcher; Friday 9 a.m. audit, EDT | Project-folder links, missing folders, and mismatch alerts | Recurring watcher/audit documented; enablement unverified. One-time backfill is documented as parked. |
| [Speaker event decks](Speaker%20Event%20Deck/README.md) | Daily 9 a.m. and 1 p.m. creation; Monday 9 a.m. reflection, ET | Notion deck task → Drive PPTX → review; post-event learnings → playbook | Two routines documented; current enablement and recent runs unverified. |

## Individual routines and experiments

| Workflow | Documented cadence | Output | Evidence / status |
| --- | --- | --- | --- |
| [Nextism of the Day](Nextism%20of%20the%20Day/README.md) | Weekdays 8 a.m. EDT | Daily phrase preview; Gmail signature update when credentials are configured | Signature setup is conditional in the README; current credential/configuration status unverified. |
| [Rachel's Culture Camp Fact of Day](Rachel%27s%20Culture%20Camp%20Fact%20of%20Day/README.md) | Weekdays 8:30 a.m. EDT | Pop-culture fact DM to Jason | Documented individual routine; current enablement unverified. |
| [WWBD — What Would Baxter Do?](WWBD/README.md) | Historic July/August test-week schedule | News + Rachel's tasks → a personalized tip | README describes a limited pilot and pending full-team approval. Do not infer a current team rollout. |

## Operating and maintenance rules

Each workflow's linked README is the starting point for its specific instructions. Before changing a live routine, identify its current runtime, enabled schedule, output destination, and last successful run. A routine ID in old documentation is not confirmation of current execution.

Use one active writer for each workflow. Where Baxter and connector variants coexist, identify the deployed variant before recreating a schedule. The Slack/OpenAI reflection implementation supersedes its older Claude schedules. The Monday Codex Substack scanner requires a handoff check against the historic Friday routine.

The older schedules above are reproduced as documented, including their EDT labels. Several use fixed UTC cron expressions. Their local times may shift in winter; verify each live schedule before treating these as year-round Eastern times. The reflection and new Substack workflow specify America/New_York.

When maintaining this directory, record the source date, whether status was checked live, and what validation actually passed. Keep documentation, scheduled activation, and successful execution distinct. Update the runtime instructions separately from GitHub files. Do not store credentials, private IDs, participant conversations, or production run logs in this public directory.

## Status checks still needed

- Confirm current enablement, active variant, and last successful run for the older Claude routines.
- Confirm only one Substack scanner is scheduled, and verify the first Monday Notion write.
- Check the first Baxter team reflection cycle after the scheduled October 16 prompts and October 19 report.
- Verify fixed-UTC schedules against intended local times before the daylight saving change.
- Confirm whether WWBD remained a pilot and whether Nextism signature configuration was completed.

These are recorded follow-up checks; this documentation update does not create tasks, activate schedules, or send team messages.
