import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { Maintenance } from "../functions/maintenance.ts";
export const MaintenanceWorkflow = DefineWorkflow({
  callback_id: "baxter_maintenance",
  title: "Baxter weekly reflection administration",
  input_parameters: {
    properties: {
      op: { type: Schema.types.string },
      week: { type: Schema.types.string },
      user: { type: Schema.types.string },
    },
    required: ["op", "week", "user"],
  },
});
MaintenanceWorkflow.addStep(Maintenance, {
  op: MaintenanceWorkflow.inputs.op,
  week: MaintenanceWorkflow.inputs.week,
  user: MaintenanceWorkflow.inputs.user,
});
