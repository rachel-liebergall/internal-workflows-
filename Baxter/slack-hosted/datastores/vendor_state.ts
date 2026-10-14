import { DefineDatastore, Schema } from "deno-slack-sdk/mod.ts";
export const VendorState = DefineDatastore({
  name: "baxter_vendor_state",
  primary_key: "id",
  attributes: {
    id: { type: Schema.types.string },
    payload: { type: Schema.types.string },
  },
});
