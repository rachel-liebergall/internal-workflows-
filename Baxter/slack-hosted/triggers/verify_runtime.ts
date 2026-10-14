export default {
  type: "scheduled",
  name: "Baxter isolated runtime verification",
  workflow: "#/workflows/baxter_maintenance",
  inputs: {
    op: { value: "verify_runtime" },
    week: { value: "none" },
    user: { value: "none" },
  },
  schedule: {
    start_time: new Date(Date.now() + 20000).toISOString(),
    frequency: { type: "once" },
  },
};
