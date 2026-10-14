export default {
  type: "scheduled",
  name: "Baxter hosted Notion connection verification",
  workflow: "#/workflows/baxter_maintenance",
  inputs: {
    op: { value: "verify_notion" },
    week: { value: "none" },
    user: { value: "none" },
  },
  schedule: {
    start_time: new Date(Date.now() + 20000).toISOString(),
    frequency: { type: "once" },
  },
};
