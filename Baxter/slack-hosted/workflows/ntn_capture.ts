import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { NtnCapture } from "../functions/ntn_capture.ts";
export const NtnCaptureWorkflow = DefineWorkflow({
  callback_id: "baxter_ntn_capture",
  title: "Baxter ntn perspectives",
  input_parameters: {
    properties: Object.fromEntries(
      ["op", "key", "channel", "channel_type", "user", "text", "message_ts"]
        .map((k) => [k, { type: Schema.types.string }]),
    ),
    required: [
      "op",
      "key",
      "channel",
      "channel_type",
      "user",
      "text",
      "message_ts",
    ],
  },
});
NtnCaptureWorkflow.addStep(NtnCapture, {
  op: NtnCaptureWorkflow.inputs.op,
  key: NtnCaptureWorkflow.inputs.key,
  channel: NtnCaptureWorkflow.inputs.channel,
  channel_type: NtnCaptureWorkflow.inputs.channel_type,
  user: NtnCaptureWorkflow.inputs.user,
  text: NtnCaptureWorkflow.inputs.text,
  message_ts: NtnCaptureWorkflow.inputs.message_ts,
});
