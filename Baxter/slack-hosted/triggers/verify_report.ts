export default {
  type: "scheduled",
  name: "Baxter synthetic report verification",
  workflow: "#/workflows/baxter_maintenance",
  inputs: {
    op: { value: "verify_runtime_reply" },
    week: { value: "2099-01-05" },
    user: { value: "none" },
  },
  schedule: {
    start_time: new Date(Date.now() + 20000).toISOString(),
    frequency: { type: "once" },
  },
};
