import { addDays, easternTime, localDate } from "../lib/common.ts";
export function weeklyTrigger(
  op: "start" | "collect" | "report",
  now = new Date(),
) {
  let friday = localDate(now);
  while (
    new Date(friday + "T12:00:00Z").getUTCDay() !== 5 ||
    Date.parse(easternTime(friday, 14)) <= now.getTime()
  ) {
    friday = addDays(friday, 1);
  }
  const day = op === "start" ? friday : addDays(friday, 3);
  return {
    type: "scheduled",
    name: `Baxter weekly ${op}`,
    workflow: "#/workflows/baxter_maintenance",
    inputs: {
      op: { value: op },
      week: { value: "automatic" },
      user: { value: "none" },
    },
    schedule: {
      timezone: "America/New_York",
      start_time: easternTime(
        day,
        op === "start" ? 14 : op === "collect" ? 9 : 10,
      ),
      frequency: {
        type: "weekly",
        repeats_every: 1,
        on_days: [op === "start" ? "Friday" : "Monday"],
      },
    },
  };
}
