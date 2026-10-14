export default {
  type: "scheduled",
  name: "Baxter vendor coverage check",
  workflow: "#/workflows/baxter_vendor_capture",
  inputs: Object.fromEntries(
    Object.entries({
      op: "coverage",
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
