import { DefineDatastore, Schema } from "deno-slack-sdk/mod.ts";
export const State = DefineDatastore({
  name: "baxter_reflection_state",
  primary_key: "id",
  attributes: {
    id: { type: Schema.types.string },
    payload: { type: Schema.types.string },
  },
});
