import { Manifest } from "deno-slack-sdk/mod.ts";
import original from "./baxter-original.json" with { type: "json" };
import { Relay } from "./functions/relay.ts";
import { Reflection } from "./workflows/reflection.ts";
import { Maintenance } from "./functions/maintenance.ts";
import { MaintenanceWorkflow } from "./workflows/maintenance.ts";
import { State } from "./datastores/state.ts";
import { TeamReply } from "./functions/team_reply.ts";
import { TeamReplyWorkflow } from "./workflows/team_reply.ts";
import { VendorCapture } from "./functions/vendor_capture.ts";
import { VendorCaptureWorkflow } from "./workflows/vendor_capture.ts";
import { VendorState } from "./datastores/vendor_state.ts";
const botScopes = [
  ...new Set([
    ...original.oauth_config.scopes.bot,
    "im:read",
    "datastore:read",
    "datastore:write",
    "triggers:write",
    "channels:history",
    "groups:history",
    "channels:read",
    "groups:read",
    "channels:join",
  ]),
];

const hosted = Manifest({
  name: "Baxter",
  icon: "",
  description: original.display_information.description,
  backgroundColor: original.display_information.background_color,
  functions: [Relay, Maintenance, TeamReply, VendorCapture],
  workflows: [
    Reflection,
    MaintenanceWorkflow,
    TeamReplyWorkflow,
    VendorCaptureWorkflow,
  ],
  datastores: [State, VendorState],
  outgoingDomains: ["api.openai.com", "api.notion.com"],
  botScopes,
});
// The user explicitly requested bot-only access and removal of user MCP.
export default {
  ...hosted,
  display_information: original.display_information,
  features: {
    ...original.features,
    app_home: {
      messages_tab_enabled: true,
      messages_tab_read_only_enabled: false,
    },
  },
  oauth_config: {
    ...original.oauth_config,
    scopes: {
      bot: botScopes,
    },
  },
  settings: {
    ...original.settings,
    is_hosted: true,
    function_runtime: "slack",
    org_deploy_enabled: true,
    is_mcp_enabled: false,
  },
};
