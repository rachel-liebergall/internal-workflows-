# Onboarding Orientation Task

When someone is being onboarded, this routine gives them their own **Orientation** task so that on day 0 they get connected to the team's shared brain: Claude, ChatGPT, Granola and Notion. Added Nov 5, 2026.

## How it works

Runs at 9am and 2pm ET on weekdays. Each run:

1. Finds open tasks in the Notion **Tasks** database whose title starts with "Onboard " (e.g. "Onboard Leah"). Tasks that only mention onboarding, such as "Track Horizon onboarding", are ignored.
2. Skips anyone who already has an "Orientation: [Name]" task.
3. Otherwise creates **Orientation: [Name]** as a subtask of the Onboard task: High priority, Operations tag, the Onboard task's due date, and a 6-step checklist (Claude, ChatGPT, Granola, Zoom, About me, try it) that mirrors "Day 0: Connect to our shared brain" in the [New Team Member Guide](https://app.notion.com/p/3e356cd2373b81c08eb6c9fde68628f4).
4. Assigns it to the new person if they already exist in Notion with an @nowtonext.ai email; otherwise to the Onboard task's assignees. A later run adds the new person once they're in Notion.
5. DMs Rachel (as Baxter) only when it created or reassigned something.

To trigger it, just create an "Onboard [Name]" task (the **Onboard Task** template works). The Orientation task appears by the next run.

## Configuration

| Field | Value |
| --- | --- |
| Routine ID | `trig_01EiuxtLHjUYNefdTUPXTZR8` |
| Schedule | `0 14,19 * * 1-5` (UTC; 9am + 2pm EST, 10am + 3pm during EDT) |
| MCP Connections | Notion |
| Slack | Baxter bot via `$BAXTER_TOKEN` (curl); no Slack MCP |
| Prompt | [onboarding-orientation-task-baxter.md](onboarding-orientation-task-baxter.md) |

The checklist in the task is a short copy of the guide's Day 0 section. If the guide's Day 0 steps change, update Step 3 of the prompt too.
