import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { VendorCapture } from "../functions/vendor_capture.ts";
export const VendorCaptureWorkflow = DefineWorkflow({
  callback_id: "baxter_vendor_capture",
  title: "Baxter vendor perspectives",
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
VendorCaptureWorkflow.addStep(VendorCapture, {
  op: VendorCaptureWorkflow.inputs.op,
  key: VendorCaptureWorkflow.inputs.key,
  channel: VendorCaptureWorkflow.inputs.channel,
  channel_type: VendorCaptureWorkflow.inputs.channel_type,
  user: VendorCaptureWorkflow.inputs.user,
  text: VendorCaptureWorkflow.inputs.text,
  message_ts: VendorCaptureWorkflow.inputs.message_ts,
});
