import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { TeamReply } from "../functions/team_reply.ts";
export const TeamReplyWorkflow = DefineWorkflow({
  callback_id: "baxter_team_reply",
  title: "Baxter live weekly conversation",
  input_parameters: {
    properties: {
      week: { type: Schema.types.string },
      user: { type: Schema.types.string },
      channel: { type: Schema.types.string },
      text: { type: Schema.types.string },
      message_ts: { type: Schema.types.string },
      thread_ts: { type: Schema.types.string },
      main_dm: { type: Schema.types.boolean },
    },
    required: ["week", "user", "channel", "text", "message_ts", "thread_ts"],
  },
});
TeamReplyWorkflow.addStep(TeamReply, {
  week: TeamReplyWorkflow.inputs.week,
  user: TeamReplyWorkflow.inputs.user,
  channel: TeamReplyWorkflow.inputs.channel,
  text: TeamReplyWorkflow.inputs.text,
  message_ts: TeamReplyWorkflow.inputs.message_ts,
  thread_ts: TeamReplyWorkflow.inputs.thread_ts,
  main_dm: TeamReplyWorkflow.inputs.main_dm,
});
