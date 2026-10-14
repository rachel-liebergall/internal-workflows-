export default {
  type: "scheduled",
  name: "Baxter read-only configuration check",
  workflow: "#/workflows/baxter_maintenance",
  inputs: {
    op: { value: "inspect" },
    week: { value: "none" },
    user: { value: "none" },
  },
  schedule: {
    start_time: new Date(Date.now() + 20000).toISOString(),
    frequency: { type: "once" },
  },
};
