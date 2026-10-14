import { deployment } from "../deployment.ts";
import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";
import {
  openai,
  put,
  type RecordData,
  REPORTS,
  roster,
  scheduledWeek,
  slack,
  TEAM,
} from "../lib/common.ts";
import { notion, reportBlock, rich, writeReport } from "../lib/notion.ts";
import { validateRuntime, VALIDATION_WEEK } from "../lib/validation.ts";
import { testDm } from "../lib/test_dm.ts";
import {
  capture,
  collect,
  dispatch,
  finish,
  report,
  start,
  syncState,
} from "../lib/cycle.ts";

export const Maintenance = DefineFunction({
  callback_id: "baxter_maintenance_step",
  title: "Baxter weekly reflection administration",
  source_file: "functions/maintenance.ts",
  input_parameters: {
    properties: {
      op: { type: Schema.types.string },
      week: { type: Schema.types.string },
      user: { type: Schema.types.string },
    },
    required: ["op", "week", "user"],
  },
  output_parameters: { properties: {}, required: [] },
});

export default SlackFunction(
  Maintenance,
  async ({ inputs, client, env, team_id }) => {
    if (team_id !== TEAM) return { error: "Wrong workspace" };
    try {
      if (inputs.op === "inspect") {
        const auth = await slack(client, "auth.test");
        // Slack workflow tokens omit bot_id even when authenticated as the app bot.
        // Pin the previously verified Baxter identity and workspace; never accept a human caller.
        if (
          auth.user_id !== deployment.botUserId || auth.team_id !== TEAM ||
          (auth.bot_id && auth.bot_id !== deployment.botId)
        ) {
          throw new Error(
            "Baxter administration must use bot authorization",
          );
        }
        const users = await roster(client, auth.user_id);
        const session = await openai(env, `sessions/${env.OPENAI_SESSION_ID}`);
        // The hosted sandbox provides its built-in shell. No external tools or MCPs are inherited.
        const tools: RecordData[] = [];
        const blocked = [
          deployment.excludedVaultId1,
          deployment.excludedVaultId2,
        ];
        const config = {
          bot: auth.user_id,
          roster: users,
          base_agent: session.agent.id,
          model: session.agent.model,
          tools,
          vault_ids: session.vault_ids.filter((v: string) =>
            !blocked.includes(v)
          ),
          instructions: session.agent.instructions,
          notion_configured: Boolean(env.NOTION_API_TOKEN),
          team_enabled: env.TEAM_ENABLED === "true",
        };
        await put(client, "config", config);
        console.log(
          JSON.stringify({
            bot: auth.user_id,
            roster: users,
            model: config.model,
            tools: tools.map((t: RecordData) => t.type),
            vault_ids: config.vault_ids,
            notion_configured: config.notion_configured,
            team_enabled: config.team_enabled,
          }),
        );
      } else if (
        inputs.op === "verify_runtime" ||
        ((inputs.op === "verify_runtime_reply" || inputs.op === "finish") &&
          inputs.week === VALIDATION_WEEK)
      ) {
        await validateRuntime(client, env, inputs.op);
      } else if (
        inputs.op === "test_dm" || inputs.op === "close_test_dm" ||
        inputs.op === "recover_test_dm"
      ) {
        await testDm(client, env, inputs.op);
      } else if (inputs.op === "verify_notion") {
        const auth = await slack(client, "auth.test");
        if (auth.user_id !== deployment.botUserId || auth.team_id !== TEAM) {
          throw new Error("Unexpected Baxter identity");
        }
        const schema = await notion(env, `data_sources/${REPORTS}`);
        if (
          schema.parent?.database_id !== deployment.reportsDatabaseId
        ) throw new Error("Unexpected Reports database");
        const page = await notion(env, "pages", "POST", {
          parent: { type: "data_source_id", data_source_id: REPORTS },
          properties: {
            Name: {
              title: rich(
                "Baxter connection check — temporary synthetic report",
              ),
            },
          },
        });
        try {
          const block = await reportBlock(env, page.id);
          const properties = Object.fromEntries(
            [
              "Response Rate",
              "Shared Patterns",
              "What's Working",
              "Friction & Blockers",
              "Overlapping Work",
              "AI Opportunity Signals",
              "New Offering Signals",
              "Non-Responders",
              "Voice Responses",
            ].map((k) => [k, "Connection check only — no team responses."]),
          );
          await writeReport(env, page.id, block, {
            properties,
            body:
              "Temporary synthetic report used to verify Baxter's hosted Notion create/update/readback connection. No participant data.",
          });
          console.log(
            JSON.stringify({
              notion_write_readback: "passed",
              reports_database: schema.parent.database_id,
              team_enabled: env.TEAM_ENABLED === "true",
            }),
          );
        } finally {
          await notion(env, `pages/${page.id}`, "PATCH", { archived: true });
        }
      } else {
        if (env.TEAM_ENABLED !== "true") return { outputs: {} };
        if (!env.NOTION_API_TOKEN || !env.OPENAI_API_KEY) {
          throw new Error(
            "Team workflow secrets are incomplete",
          );
        }
        let week = inputs.week;
        if (["start", "collect", "report"].includes(inputs.op)) {
          week = scheduledWeek(inputs.op) || "";
          if (!week) return { outputs: {} };
        }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(week)) {
          throw new Error(
            "Invalid cycle week",
          );
        }
        switch (inputs.op) {
          case "start":
            await start(client, env, week);
            break;
          case "dispatch":
            await dispatch(client, env, week, inputs.user);
            break;
          case "collect":
            await collect(client, week);
            break;
          case "capture":
            await capture(client, week, inputs.user);
            break;
          case "report":
            await report(client, env, week);
            break;
          case "finish":
            await finish(client, env, week);
            break;
          case "state":
            await syncState(client, env, week);
            break;
          default:
            return { error: "Unknown administration operation" };
        }
      }
      return { outputs: {} };
    } catch (e) {
      return {
        error: e instanceof Error ? e.message : "Baxter administration failed",
      };
    }
  },
);
