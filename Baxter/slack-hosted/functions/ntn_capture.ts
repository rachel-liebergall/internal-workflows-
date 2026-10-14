import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";
import { ntnCapture } from "../lib/ntn_capture.ts";
export const NtnCapture = DefineFunction({
  callback_id: "baxter_ntn_capture_step",
  title: "Capture ntn knowledge",
  source_file: "functions/ntn_capture.ts",
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
  NtnCapture,
  async ({ inputs, client, env, team_id }) => {
    try {
      await ntnCapture(client, env, team_id, inputs);
      return { outputs: {} };
    } catch (e) {
      // Do not log source messages, tokens or raw API responses.
      return {
        error: e instanceof Error ? e.message : "Ntn capture failed",
      };
    }
  },
);
