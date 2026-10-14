import { BAXTER } from "../lib/vendor_rules.ts";
export const vendorTrigger = {
  type: "event",
  name: "Baxter vendor mentions across channels",
  workflow: "#/workflows/baxter_vendor_capture",
  event: {
    event_type: "slack#/events/message_posted",
    all_resources: true,
    filter: {
      version: 1,
      root: {
        operator: "AND",
        inputs: [
          { statement: `{{data.user_id}} != ${BAXTER}` },
          {
            operator: "OR",
            inputs: [
              { statement: "{{data.channel_type}} == public" },
              { statement: "{{data.channel_type}} == private" },
            ],
          },
        ],
      },
    },
  },
  inputs: {
    op: { value: "capture" },
    key: { value: "none" },
    channel: { value: "{{data.channel_id}}" },
    channel_type: { value: "{{data.channel_type}}" },
    user: { value: "{{data.user_id}}" },
    text: { value: "{{data.text}}" },
    message_ts: { value: "{{data.message_ts}}" },
  },
};
export default vendorTrigger;
