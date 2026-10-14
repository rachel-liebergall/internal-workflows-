import { type RecordData } from "./common.ts";
export function dmTrigger(p: RecordData, week: string, user: string) {
  return {
    type: "event",
    name: `Baxter reflection DM ${week} ${user}`,
    workflow: "#/workflows/baxter_team_reply",
    event: {
      event_type: "slack#/events/message_posted",
      channel_ids: [p.channel],
      filter: {
        version: 1,
        root: {
          operator: "AND",
          inputs: [
            { statement: `{{data.user_id}} == ${user}` },
            { statement: "{{data.thread_ts}} == null" },
          ],
        },
      },
    },
    inputs: {
      week: { value: week },
      user: { value: "{{data.user_id}}" },
      channel: { value: "{{data.channel_id}}" },
      text: { value: "{{data.text}}" },
      message_ts: { value: "{{data.message_ts}}" },
      thread_ts: { value: p.root },
      main_dm: { value: true },
    },
  };
}
