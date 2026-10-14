import { DefineDatastore, Schema } from "deno-slack-sdk/mod.ts";
export const NtnState = DefineDatastore({
  name: "baxter_ntn_state",
  primary_key: "id",
  attributes: {
    id: { type: Schema.types.string },
    payload: { type: Schema.types.string },
  },
});
