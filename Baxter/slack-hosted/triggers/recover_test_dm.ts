export default {
  type: "scheduled",
  name: "Recover Rachel Baxter DM reply",
  workflow: "#/workflows/baxter_maintenance",
  inputs: {
    op: { value: "recover_test_dm" },
    week: { value: "none" },
    user: { value: "none" },
  },
  schedule: {
    start_time: new Date(Date.now() + 20000).toISOString(),
    frequency: { type: "once" },
  },
};
