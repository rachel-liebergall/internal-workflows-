import { deployment } from "../deployment.ts";
import { Trigger } from "deno-slack-api/types.ts";
import { TriggerEventTypes, TriggerTypes } from "deno-slack-api/mod.ts";
import { Reflection } from "../workflows/reflection.ts";

const trigger: Trigger<typeof Reflection.definition> = {
  type: TriggerTypes.Event,
  name: "Rachel-only Baxter DM pilot",
  workflow: "#/workflows/baxter_reflection_pilot",
  event: {
    event_type: TriggerEventTypes.MessagePosted,
    channel_ids: [deployment.pilotChannelId],
    filter: {
      version: 1,
      root: { statement: `{{data.user_id}} == ${deployment.pilotUserId}` },
    },
  },
  inputs: {
    channel: { value: "{{data.channel_id}}" },
    user: { value: "{{data.user_id}}" },
    text: { value: "{{data.text}}" },
    message_ts: { value: "{{data.message_ts}}" },
  },
};
export default trigger;
