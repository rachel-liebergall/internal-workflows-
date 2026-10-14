export default {
  type: "scheduled",
  name: "Baxter ntn destination read-only check",
  workflow: "#/workflows/baxter_ntn_capture",
  inputs: Object.fromEntries(
    Object.entries({
      op: "verify",
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
