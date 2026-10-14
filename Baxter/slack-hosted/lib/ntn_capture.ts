import {
  type Client,
  get,
  openai,
  type RecordData,
  slack,
  TEAM,
} from "./common.ts";
import {
  acceptedChannel,
  BAXTER,
  mentionsNtn,
  NTN_INSTRUCTIONS,
  ntnKey,
  SEEDS,
  validateInsights,
} from "./ntn_rules.ts";
import { notion, rich } from "./notion.ts";
import { NTN_SOURCE } from "./ntn_rules.ts";
import { ntnRows, ntnSchema, plain, saveInsight } from "./ntn_notion.ts";
const STORE = "baxter_ntn_state";
export type NtnInput = {
  op: string;
  key: string;
  channel: string;
  channel_type: string;
  user: string;
  text: string;
  message_ts: string;
};
async function load(client: Client, id: string): Promise<RecordData | null> {
  const r = await client.apiCall("apps.datastore.get", {
    datastore: STORE,
    id,
  });
  if (!r.ok && r.error === "datastore_item_not_found") return null;
  if (!r.ok) throw new Error("Ntn datastore read failed");
  return r.item?.payload ? JSON.parse(r.item.payload) : null;
}
async function save(client: Client, id: string, value: RecordData) {
  const payload = JSON.stringify(value);
  if (new TextEncoder().encode(payload).length > 200000) {
    throw new Error("Ntn job exceeds state size limit");
  }
  await slack(client, "apps.datastore.put", {
    datastore: STORE,
    item: { id, payload },
  });
}
async function later(client: Client, key: string) {
  await slack(client, "workflows.triggers.create", {
    type: "scheduled",
    name: `Baxter ntn finish ${key}`,
    workflow: "#/workflows/baxter_ntn_capture",
    schedule: {
      start_time: new Date(Date.now() + 60000).toISOString(),
      frequency: { type: "once" },
    },
    inputs: Object.fromEntries(
      Object.entries({
        op: "finish",
        key,
        channel: "none",
        channel_type: "none",
        user: "none",
        text: "none",
        message_ts: "none",
      }).map(([k, v]) => [k, { value: v }]),
    ),
  });
}
async function agentList(env: Record<string, string>, path: string) {
  const rows: RecordData[] = [];
  let after = "";
  do {
    const r = await openai(
      env,
      `${path}?order=asc&limit=100${
        after ? `&after=${encodeURIComponent(after)}` : ""
      }`,
    );
    rows.push(...r.data);
    after = r.has_more ? r.last_id : "";
    if (r.has_more && !after) {
      throw new Error("Incomplete ntn analysis pagination");
    }
  } while (after);
  return rows;
}
export async function ntnCapture(
  client: Client,
  env: Record<string, string>,
  team: string,
  input: NtnInput,
) {
  if (team !== TEAM) return;
  // An explicitly enabled feature flag is required; deploy code before activating.
  if (
    env.NTN_CAPTURE_ENABLED !== "true" &&
    !["verify", "verify_write", "coverage", "join_public"].includes(input.op)
  ) return;
  const auth = await slack(client, "auth.test");
  if (auth.team_id !== TEAM || auth.user_id !== BAXTER) {
    throw new Error("Ntn capture requires Baxter bot authorization");
  }
  if (["coverage", "join_public"].includes(input.op)) {
    const channels: RecordData[] = [];
    let cursor = "";
    do {
      const result = await slack(client, "conversations.list", {
        types: "public_channel,private_channel",
        exclude_archived: true,
        limit: 200,
        ...(cursor ? { cursor } : {}),
      });
      channels.push(
        ...result.channels.map((c: RecordData) => ({
          id: c.id,
          name: c.name,
          member: c.is_member,
          private: c.is_private,
          shared: c.is_ext_shared,
        })),
      );
      cursor = result.response_metadata?.next_cursor || "";
    } while (cursor);
    if (input.op === "join_public") {
      for (const channel of channels) {
        if (!channel.member && !channel.private && !channel.shared) {
          try {
            await slack(client, "conversations.join", { channel: channel.id });
            channel.member = true;
          } catch {
            channel.join_failed = true;
          }
        }
      }
    }
    console.log(JSON.stringify({ ntn_channel_coverage: channels }));
    return;
  }
  if (input.op === "verify_write") {
    await ntnSchema(env);
    const key = `setup:ntn-write:${Date.now()}`;
    const page = await notion(env, "pages", "POST", {
      parent: { type: "data_source_id", data_source_id: NTN_SOURCE },
      properties: {
        Insight: {
          title: rich("Baxter connection check — temporary synthetic capture"),
        },
        "Insight Key": { rich_text: rich(key) },
        "NTN Wording": {
          rich_text: rich(
            "Setup verification only. Not a ntn insight. This row is archived immediately after readback.",
          ),
        },
      },
    });
    try {
      const checked = await notion(env, `pages/${page.id}`);
      if (plain(checked.properties?.["Insight Key"]?.rich_text) !== key) {
        throw new Error("Synthetic ntn write verification failed");
      }
    } finally {
      await notion(env, `pages/${page.id}`, "PATCH", { archived: true });
    }
    const archived = await notion(env, `pages/${page.id}`);
    if (!archived.archived && !archived.in_trash) {
      throw new Error("Temporary ntn test row was not archived");
    }
    console.log(
      JSON.stringify({
        ntn_write_readback: "passed",
        temporary_row_archived: true,
      }),
    );
    return;
  }
  if (input.op === "verify") {
    await ntnSchema(env);
    console.log(
      JSON.stringify({
        ntn_schema_read: "passed",
        writes: 0,
        capture_enabled: env.NTN_CAPTURE_ENABLED === "true",
      }),
    );
    return;
  }
  if (!env.OPENAI_API_KEY || !env.NOTION_API_TOKEN) {
    throw new Error("Ntn capture secrets unavailable");
  }
  let key = input.key;
  if (input.op === "capture") {
    if (!acceptedChannel(input.channel_type) || input.user === BAXTER) return;
    const cached = await load(client, "known-ntns");
    if (!mentionsNtn(input.text, [...SEEDS, ...(cached?.names || [])])) {
      return;
    }
    key = ntnKey(input.channel, input.message_ts);
    const previous = await load(client, key);
    if (previous?.status === "completed" || previous?.status === "skipped") {
      return;
    }
    if (previous?.session) {
      // Resume the original job and its frozen analysis; do not start another session.
      await later(client, key);
      return;
    }
    const channel = await slack(client, "conversations.info", {
      channel: input.channel,
    });
    if (
      !channel.channel?.is_member || channel.channel?.is_im ||
      channel.channel?.is_mpim || channel.channel?.is_ext_shared
    ) return;
    const user = (await slack(client, "users.info", { user: input.user })).user;
    if (
      !user || user.deleted || user.is_bot || user.is_app_user ||
      user.is_restricted || user.is_ultra_restricted ||
      (user.team_id && user.team_id !== TEAM)
    ) return;
    await ntnSchema(env);
    const existing = await ntnRows(env);
    const names = [
      ...new Set([
        ...SEEDS,
        ...existing.flatMap((p) =>
          plain(p.properties?.["NTN Author"]?.rich_text).split(/;|\n/).map((
            s,
          ) => s.trim()).filter(Boolean)
        ),
      ]),
    ];
    await save(client, "known-ntns", { names });
    if (!mentionsNtn(input.text, names)) return;
    if (input.text.length > 24000) {
      throw new Error("Message too large; daily reconciliation must review it");
    }
    const link = (await slack(client, "chat.getPermalink", {
      channel: input.channel,
      message_ts: input.message_ts,
    })).permalink;
    const author = user.profile?.real_name || user.real_name || user.name ||
      input.user;
    const job = previous ||
      {
        status: "preparing",
        source: {
          channel: input.channel,
          channel_name: channel.channel.name || input.channel,
          ts: input.message_ts,
          author,
          link,
        },
        text: input.text,
        checked: 0,
        urls: [],
      };
    // Freeze the exact input before creating the session; an uncertain create can reuse the idempotency key.
    if (!job.analysis_input) {
      job.analysis_input = JSON.stringify({
        author,
        text: job.text,
        existing: existing.map((p) => ({
          ntn: plain(p.properties?.["NTN Author"]?.rich_text),
          takeaway: plain(p.properties?.["NTN Wording"]?.rich_text),
          type: p.properties?.["Insight Type"]?.select?.name,
        })),
      });
    }
    await save(client, key, job);
    const config = await get(client, "config");
    if (!config?.model) {
      throw new Error("Baxter agent model configuration missing");
    }
    const result = await openai(env, "sessions", {
      agent: {
        model: config.model,
        tools: [],
        instructions: NTN_INSTRUCTIONS,
      },
      environment: { type: "none" },
      vault_ids: [],
      input: job.analysis_input,
      metadata: { purpose: "ntn_capture", source: key },
    }, `baxter-${key}`);
    job.session = result.id;
    job.status = "analyzing";
    delete job.analysis_input;
    await save(client, key, job);
    await later(client, key);
    return;
  }
  if (input.op !== "finish" || !/^ntn:[CG][A-Z0-9]+:\d+\.\d+$/.test(key)) {
    throw new Error("Invalid ntn operation");
  }
  const job = await load(client, key);
  if (!job?.session) {
    throw new Error("Ntn job missing; inspect state before retrying");
  }
  if (["completed", "skipped"].includes(job.status)) return;
  if (!job.insights) {
    const turns = (await agentList(env, `sessions/${job.session}/turns`))
      .filter((t) => !t.subagent_id);
    const last = turns.at(-1);
    if (!last || ["queued", "in_progress"].includes(last.status)) {
      job.checked = (job.checked || 0) + 1;
      await save(client, key, job);
      if (job.checked >= 15) {
        throw new Error("Ntn analysis timeout; manual recovery needed");
      }
      await later(client, key);
      return;
    }
    if (last.status !== "completed") {
      throw new Error("Ntn analysis failed; manual recovery needed");
    }
    const items = await agentList(env, `sessions/${job.session}/items`);
    const final = items.filter((i) =>
      i.type === "message" && i.role === "assistant" && i.turn_id === last.id &&
      i.phase === "final_answer"
    ).at(-1);
    const text = final?.content.filter((c: RecordData) =>
      c.type === "output_text"
    ).map((c: RecordData) => c.text).join("");
    job.insights = validateInsights(
      JSON.parse(text || "null"),
      job.text,
      job.source.author,
    );
    await save(client, key, job);
  }
  await ntnSchema(env);
  for (let index = job.urls.length; index < job.insights.length; index++) {
    job.urls.push(
      await saveInsight(env, job.insights[index], job.source, index),
    );
    await save(client, key, job);
  }
  job.status = job.insights.length ? "completed" : "skipped";
  job.completed_at = new Date().toISOString();
  // Retain the source identity and evidence, not an unnecessary full message copy.
  delete job.text;
  await save(client, key, job);
  console.log(
    JSON.stringify({
      ntn_job: key,
      status: job.status,
      added_or_reconciled: job.urls.length,
    }),
  );
}
