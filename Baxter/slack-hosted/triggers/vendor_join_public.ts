export default {
  type: "scheduled",
  name: "Baxter join public channels for vendor capture",
  workflow: "#/workflows/baxter_vendor_capture",
  inputs: Object.fromEntries(
    Object.entries({
      op: "join_public",
      key: "none",
      channel: "none",
      channel_type: "none",
      user: "none",
      text: "none",
      message_ts: "none",
    }).map(([k, v]) => [k, { value: v }]),
  ),
  schedule: {
    start_time: new Date(Date.now() + 20000).toISOString(),
    frequency: { type: "once" },
  },
};
