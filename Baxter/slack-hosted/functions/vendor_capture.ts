import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";
import { vendorCapture } from "../lib/vendor_capture.ts";
export const VendorCapture = DefineFunction({
  callback_id: "baxter_vendor_capture_step",
  title: "Capture vendor knowledge",
  source_file: "functions/vendor_capture.ts",
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
  output_parameters: { properties: {}, required: [] },
});
export default SlackFunction(
  VendorCapture,
  async ({ inputs, client, env, team_id }) => {
    try {
      await vendorCapture(client, env, team_id, inputs);
      return { outputs: {} };
    } catch (e) {
      // Do not log source messages, tokens or raw API responses.
      return {
        error: e instanceof Error ? e.message : "Vendor capture failed",
      };
    }
  },
);
