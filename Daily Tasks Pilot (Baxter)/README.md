# Daily Tasks Pilot (Baxter)

A three-part weekday loop that posts each pilot member's Notion tasks in the morning, applies their thread replies to Notion during the day, and closes with an end-of-day check. Launched October 15, 2026 for Rachel (ET) and Patrick (PT). It replaces the retired [Daily Task Roundup](../Daily%20Task%20Roundup/README.md) and [EOD Task Check-In](../EOD%20Task%20Check-In/README.md) routines.

## What the pilot member sees

1. **Morning (8:30am ET for Rachel, 7:30am PT for Patrick):** Baxter posts tasks due today, grouped by project, plus the 3 most recently overdue tasks and a count of older ones. Ongoing tasks are left out of the overdue list. Every task is numbered and links to Notion.
2. **During the day:** the person replies in the morning thread in plain language, for example "push 3 to Fri", "move 2 to Mon 2pm", "sent it", or a progress note. Baxter updates Notion within the hour and confirms in the thread.
   - **New tasks due today:** every hour Baxter also checks Notion for tasks assigned to the person that became due today after the morning post (newly created, or re-dated to today). It adds them to the morning thread in one batched "🆕 Added since this morning" reply, continuing the numbering. Tasks a person assigned @mention the owner. Tasks created from meetings (with a linked `Meeting` in Notion) are grouped under "From today's meetings", and if those are the only new tasks there's no @mention.
3. **5pm local:** Baxter posts an EOD check with ✅ Done, 🔄 Moved and ⏳ No movement, then asks "Anything to carry over or flag for tomorrow? Just reply here." Before building it, the EOD applies any late replies, runs a final check for tasks newly due today, and re-checks Notion. Tasks added at 3:30pm or later are marked _(added late)_ so they don't read as slippage. Replies are applied before the next morning's list.

## Where it posts

Messages go to private channels, not DMs, so Claude (Claude Tag) can be invited alongside Baxter. Slack only lets an agent join a DM when the DM is created.

| Person | Channel |
| --- | --- |
| Rachel | `#rachel-daily-` (looked up by name each run; `rachel-daily` also accepted) |
| Patrick | `#patrick-daily` |

Members: the person, the Baxter bot and Claude. Rachel is not a member of Patrick's channel.

## Guardrails

- **Only the person's own thread replies change Notion.** Replies from Claude or other apps are ignored, and so are messages that @mention Claude.
- **Plain-language replies are interpreted.** Date or time changes update `Due Date`. Finished, started or dropped updates `Status`. Progress notes become a comment on the task. If a reply is unclear, Baxter asks one question in the thread and changes nothing.
- **Slack activity is context only.** The EOD routine searches the person's Slack messages from that day (read-only) and adds short notes. It never changes Notion based on that search.
- **Rachel gets no summary of Patrick's day.** His updates only flow into Notion.
- **Clock changes:** each routine fires at several UTC times and checks each person's local time, so schedules stay correct on both sides of daylight saving.

## Routines

| Routine | ID | Cron (UTC) | Connectors | Prompt |
| --- | --- | --- | --- | --- |
| daily-tasks-morning-baxter | `trig_01MTqTfgWqTCTywDY5R4BTGQ` | `30 12-15 * * 1-5` (time-guarded) | Notion | [morning](daily-tasks-morning-baxter.md) |
| daily-tasks-reply-sweep-baxter | `trig_017XangL6QEMmt7tczNNP6B5` | `15 0,13-23 * * *` (time-guarded) | Notion | [reply sweep](daily-tasks-reply-sweep-baxter.md) |
| daily-tasks-eod-baxter | `trig_013Yg58pgr6h73BaiVK9CzN9` | `0 0,1,21,22 * * *` (time-guarded) | Notion, Slack (read/search only) | [EOD](daily-tasks-eod-baxter.md) |

All Slack posts come from the **Baxter bot** via `$BAXTER_TOKEN` (curl). The Slack connector on the EOD routine is signed in as the separate "Baxter the PM" user account, so its search only sees channels that account is in. It is restricted to read/search tools and never posts.

## Notion

Tasks data source `collection://49856cd2-373b-824b-a95f-875c3f4e5c29`. The project relation property is named `Task`. Open statuses: Backlog, Not started, In progress, Ongoing, Under Review By Scribe.

## Known limits

- Baxter's bot token has no `groups:write`, so it can't create private channels or invite people. A person must create the channel and run `/invite @Baxter` and `/invite @Claude`.
- "Done today" in the EOD check relies on Notion edit times. A task marked Done without a fresh edit timestamp can be missed.
- The Baxter Slack app is managed with the Slack CLI from two local project folders that deploy to the same app. Reconcile them before redeploying Baxter.

## Adding someone to the pilot

1. Create a private channel `#<name>-daily`, then run `/invite @Baxter` and `/invite @Claude` in the channel's message box (not in a thread).
2. Add a row to the PILOT GROUP table in all three prompts: Slack ID, Notion user ID, time zone, send time and channel ID.
3. Widen each routine's UTC cron hours if the new time zone falls outside the current windows.
4. Post a short intro from Baxter explaining the loop, including that Slack messages are used as context.
