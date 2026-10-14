import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { Relay } from "../functions/relay.ts";

export const Reflection = DefineWorkflow({
  callback_id: "baxter_reflection_pilot",
  title: "Baxter reflection pilot",
  description: "Live replies restricted to Rachel's existing Baxter DM.",
  input_parameters: {
    properties: {
      channel: { type: Schema.types.string },
      user: { type: Schema.types.string },
      text: { type: Schema.types.string },
      message_ts: { type: Schema.types.string },
    },
    required: ["channel", "user", "text", "message_ts"],
  },
});
Reflection.addStep(Relay, {
  channel: Reflection.inputs.channel,
  user: Reflection.inputs.user,
  text: Reflection.inputs.text,
  message_ts: Reflection.inputs.message_ts,
});
