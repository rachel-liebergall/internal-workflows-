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
  mentionsVendor,
  SEEDS,
  validateInsights,
  VENDOR_INSTRUCTIONS,
  vendorKey,
} from "./vendor_rules.ts";
import { notion, rich } from "./notion.ts";
import { VENDOR_SOURCE } from "./vendor_rules.ts";
import {
  plain,
  saveInsight,
  vendorRows,
  vendorSchema,
} from "./vendor_notion.ts";
const STORE = "baxter_vendor_state";
export type VendorInput = {
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
  if (!r.ok) throw new Error("Vendor datastore read failed");
  return r.item?.payload ? JSON.parse(r.item.payload) : null;
}
async function save(client: Client, id: string, value: RecordData) {
  const payload = JSON.stringify(value);
  if (new TextEncoder().encode(payload).length > 200000) {
    throw new Error("Vendor job exceeds state size limit");
  }
  await slack(client, "apps.datastore.put", {
    datastore: STORE,
    item: { id, payload },
  });
}
async function later(client: Client, key: string) {
  await slack(client, "workflows.triggers.create", {
    type: "scheduled",
    name: `Baxter vendor finish ${key}`,
    workflow: "#/workflows/baxter_vendor_capture",
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
      throw new Error("Incomplete vendor analysis pagination");
    }
  } while (after);
  return rows;
}
export async function vendorCapture(
  client: Client,
  env: Record<string, string>,
  team: string,
  input: VendorInput,
) {
  if (team !== TEAM) return;
  // An explicitly enabled feature flag is required; deploy code before activating.
  if (
    env.VENDOR_CAPTURE_ENABLED !== "true" &&
    !["verify", "verify_write", "coverage", "join_public"].includes(input.op)
  ) return;
  const auth = await slack(client, "auth.test");
  if (auth.team_id !== TEAM || auth.user_id !== BAXTER) {
    throw new Error("Vendor capture requires Baxter bot authorization");
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
    console.log(JSON.stringify({ vendor_channel_coverage: channels }));
    return;
  }
  if (input.op === "verify_write") {
    await vendorSchema(env);
    const key = `setup:vendor-write:${Date.now()}`;
    const page = await notion(env, "pages", "POST", {
      parent: { type: "data_source_id", data_source_id: VENDOR_SOURCE },
      properties: {
        Insight: {
          title: rich("Baxter connection check — temporary synthetic capture"),
        },
        "Insight Key": { rich_text: rich(key) },
        Takeaway: {
          rich_text: rich(
            "Setup verification only. Not a vendor insight. This row is archived immediately after readback.",
          ),
        },
      },
    });
    try {
      const checked = await notion(env, `pages/${page.id}`);
      if (plain(checked.properties?.["Insight Key"]?.rich_text) !== key) {
        throw new Error("Synthetic vendor write verification failed");
      }
    } finally {
      await notion(env, `pages/${page.id}`, "PATCH", { archived: true });
    }
    const archived = await notion(env, `pages/${page.id}`);
    if (!archived.archived && !archived.in_trash) {
      throw new Error("Temporary vendor test row was not archived");
    }
    console.log(
      JSON.stringify({
        vendor_write_readback: "passed",
        temporary_row_archived: true,
      }),
    );
    return;
  }
  if (input.op === "verify") {
    await vendorSchema(env);
    console.log(
      JSON.stringify({
        vendor_schema_read: "passed",
        writes: 0,
        capture_enabled: env.VENDOR_CAPTURE_ENABLED === "true",
      }),
    );
    return;
  }
  if (!env.OPENAI_API_KEY || !env.NOTION_API_TOKEN) {
    throw new Error("Vendor capture secrets unavailable");
  }
  let key = input.key;
  if (input.op === "capture") {
    if (!acceptedChannel(input.channel_type) || input.user === BAXTER) return;
    const cached = await load(client, "known-vendors");
    if (!mentionsVendor(input.text, [...SEEDS, ...(cached?.names || [])])) {
      return;
    }
    key = vendorKey(input.channel, input.message_ts);
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
      channel.channel?.is_mpim
    ) return;
    const user = (await slack(client, "users.info", { user: input.user })).user;
    if (
      !user || user.deleted || user.is_bot || user.is_app_user
    ) return;
    await vendorSchema(env);
    const existing = await vendorRows(env);
    const names = [
      ...new Set([
        ...SEEDS,
        ...existing.flatMap((p) =>
          plain(p.properties?.Vendor?.rich_text).split(/;|\n/).map((s) =>
            s.trim()
          ).filter(Boolean)
        ),
      ]),
    ];
    await save(client, "known-vendors", { names });
    if (!mentionsVendor(input.text, names)) return;
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
          vendor: plain(p.properties?.Vendor?.rich_text),
          takeaway: plain(p.properties?.Takeaway?.rich_text),
          type: p.properties?.Type?.select?.name,
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
        instructions: VENDOR_INSTRUCTIONS,
      },
      environment: { type: "none" },
      vault_ids: [],
      input: job.analysis_input,
      metadata: { purpose: "vendor_capture", source: key },
    }, `baxter-${key}`);
    job.session = result.id;
    job.status = "analyzing";
    delete job.analysis_input;
    await save(client, key, job);
    await later(client, key);
    return;
  }
  if (input.op !== "finish" || !/^vendor:[CG][A-Z0-9]+:\d+\.\d+$/.test(key)) {
    throw new Error("Invalid vendor operation");
  }
  const job = await load(client, key);
  if (!job?.session) {
    throw new Error("Vendor job missing; inspect state before retrying");
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
        throw new Error("Vendor analysis timeout; manual recovery needed");
      }
      await later(client, key);
      return;
    }
    if (last.status !== "completed") {
      throw new Error("Vendor analysis failed; manual recovery needed");
    }
    const items = await agentList(env, `sessions/${job.session}/items`);
    const final = items.filter((i) =>
      i.type === "message" && i.role === "assistant" && i.turn_id === last.id &&
      i.phase === "final_answer"
    ).at(-1);
    const text = final?.content.filter((c: RecordData) =>
      c.type === "output_text"
    ).map((c: RecordData) => c.text).join("");
    job.insights = validateInsights(JSON.parse(text || "null"), job.text);
    await save(client, key, job);
  }
  await vendorSchema(env);
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
      vendor_job: key,
      status: job.status,
      added_or_reconciled: job.urls.length,
    }),
  );
}
