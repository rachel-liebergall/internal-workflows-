export default {
  type: "scheduled",
  name: "Rachel Baxter reflection test",
  workflow: "#/workflows/baxter_maintenance",
  inputs: {
    op: { value: "test_dm" },
    week: { value: "none" },
    user: { value: "none" },
  },
  schedule: {
    start_time: new Date(Date.now() + 20000).toISOString(),
    frequency: { type: "once" },
  },
};
