import { deployment } from "../deployment.ts";
import { dmTrigger } from "./dm_trigger.ts";
import {
  addDays,
  type Client,
  easternTime,
  get,
  inputEvent,
  openai,
  participantKey,
  put,
  type RecordData,
  roster,
  scheduleOnce,
  slack,
  TEAM,
  thread,
} from "./common.ts";
import {
  children,
  collectionPage,
  notion,
  paragraph,
  reportBlock,
  rich,
  writeReport,
} from "./notion.ts";
import {
  conversationInstructions,
  fridayPrompt,
  REPORT_INSTRUCTIONS,
} from "./prompts.ts";

export async function start(
  client: Client,
  env: Record<string, string>,
  week: string,
) {
  let cycle = await get(client, `week:${week}`);
  if (!cycle) {
    const config = await get(client, "config");
    if (!config) throw new Error("Run Baxter inspect first");
    const auth = await slack(client, "auth.test");
    if (
      auth.user_id !== config.bot || auth.user_id !== deployment.botUserId ||
      auth.team_id !== TEAM ||
      (auth.bot_id && auth.bot_id !== deployment.botId)
    ) {
      throw new Error("Unexpected bot identity");
    }
    const users = await roster(client, auth.user_id);
    const page = await collectionPage(env, week);
    const block = await reportBlock(env, page.id);
    cycle = {
      week,
      roster: users,
      bot: auth.user_id,
      page: page.id,
      block,
      cutoff: easternTime(addDays(week, 7), 9),
      report_status: "collecting",
    };
    await put(client, `week:${week}`, cycle);
    await syncState(client, env, week);
  }
  // Snapshot is immutable on rerun. Enqueue work separately so Slack's runtime can finish promptly.
  for (let i = 0; i < cycle.roster.length; i++) {
    const u = cycle.roster[i];
    const id = participantKey(week, u.id);
    let p = await get(client, id);
    if (!p) {
      p = {
        week,
        user: u.id,
        name: u.name,
        first: u.first,
        bot: cycle.bot,
        status: "pending",
      };
      await put(client, id, p);
    }
    if (p.status !== "sent" || !p.session || !p.trigger || !p.ready) {
      await scheduleOnce(client, "dispatch", week, u.id, 10 + i * 15);
    }
  }
  await scheduleOnce(client, "state", week, "", 60 + cycle.roster.length * 15);
}
async function reconcile(client: Client, p: RecordData, week: string) {
  let cursor = "";
  const matches: RecordData[] = [];
  const oldest = Date.parse(easternTime(addDays(week, 4), 0)) / 1000;
  do {
    const r = await slack(client, "conversations.history", {
      channel: p.channel,
      oldest: String(oldest),
      include_all_metadata: true,
      limit: 100,
      ...(cursor ? { cursor } : {}),
    });
    matches.push(...r.messages.filter((m: RecordData) =>
      m.user === p.bot &&
      m.metadata?.event_type === "ntn_reflection_prompt" &&
      m.metadata?.event_payload?.week_key === week
    ));
    cursor = r.response_metadata?.next_cursor || "";
    if (r.has_more && !cursor) {
      throw new Error("Incomplete prompt reconciliation");
    }
  } while (cursor);
  if (matches.length > 1) {
    throw new Error("Duplicate prompts found; review before proceeding");
  }
  return matches[0]?.ts || null;
}
export async function dispatch(
  client: Client,
  env: Record<string, string>,
  week: string,
  user: string,
) {
  const cycle = await get(client, `week:${week}`);
  const p = await get(client, participantKey(week, user));
  if (!cycle || !p || !cycle.roster.some((u: RecordData) => u.id === user)) {
    throw new Error("Unknown participant cycle");
  }
  if (Date.now() >= Date.parse(cycle.cutoff)) {
    throw new Error("Reflection cycle closed");
  }
  if (!p.channel) {
    p.channel =
      (await slack(client, "conversations.open", { users: user })).channel.id;
    await put(client, participantKey(week, user), p);
  }
  if (!p.root) {
    p.root = await reconcile(client, p, week);
    if (!p.root) {
      if (p.status === "sending") {
        throw new Error(
          "Previous delivery was uncertain; inspect before retrying",
        );
      }
      p.status = "sending";
      await put(client, participantKey(week, user), p);
      const sent = await slack(client, "chat.postMessage", {
        channel: p.channel,
        text: fridayPrompt(p.first, week),
        metadata: {
          event_type: "ntn_reflection_prompt",
          event_payload: { week_key: week },
        },
      });
      p.root = sent.ts;
    }
    p.status = "sent";
    await put(client, participantKey(week, user), p);
  }
  if (!p.session) {
    const c = await get(client, "config");
    if (!c?.vault_ids?.length) {
      throw new Error("Bot vault configuration missing");
    }
    const s = await openai(env, "sessions", {
      agent_id: c.base_agent,
      agent: {
        model: c.model,
        tools: c.tools,
        instructions: conversationInstructions(p, cycle.cutoff),
      },
      environment: {
        type: "openai_hosted",
        container_size: "small",
        network: { access: "restricted", allowed_domains: ["slack.com"] },
      },
      vault_ids: c.vault_ids,
      metadata: { purpose: "weekly_reflection", week, participant: user },
    }, `baxter-session-${week}-${user}`);
    p.session = s.id;
    p.session_created_at = Date.now();
    p.routing_version = 2;
    await put(client, participantKey(week, user), p);
  }
  if (!p.trigger) {
    const t = await slack(client, "workflows.triggers.create", {
      type: "event",
      name: `Baxter reflection ${week} ${user}`,
      workflow: "#/workflows/baxter_team_reply",
      event: {
        event_type: "slack#/events/message_posted",
        channel_ids: [p.channel],
        filter: {
          version: 1,
          root: {
            operator: "AND",
            inputs: [
              { statement: `{{data.user_id}} == ${user}` },
              { statement: "{{data.thread_ts}} != null" },
            ],
          },
        },
      },
      inputs: {
        week: { value: week },
        user: { value: "{{data.user_id}}" },
        channel: { value: "{{data.channel_id}}" },
        text: { value: "{{data.text}}" },
        message_ts: { value: "{{data.message_ts}}" },
        thread_ts: { value: "{{data.thread_ts}}" },
      },
    });
    p.trigger = t.trigger.id;
    await put(client, participantKey(week, user), p);
  }
  if (!p.dm_trigger) {
    const t = await slack(
      client,
      "workflows.triggers.create",
      dmTrigger(p, week, user),
    );
    p.dm_trigger = t.trigger.id;
    await put(client, participantKey(week, user), p);
  }
  // Recover participant replies posted while the session and event listener were being provisioned.
  const messages = await thread(client, p, cycle.cutoff);
  for (const m of messages.filter((m) => m.author === "participant")) {
    await openai(
      env,
      `sessions/${p.session}/events`,
      inputEvent([
        `New authorized reflection message: channel ${p.channel}, thread ${p.root}, participant ${user}, timestamp ${m.ts}.`,
        "Continue this person's reflection. Reconcile source_ts metadata and respond only if this message is still unanswered.",
        JSON.stringify({ participant_text: m.text }),
      ].join("\n")),
      `baxter-team-${week}-${user}-${m.ts}`,
    );
  }
  p.ready = true;
  await put(client, participantKey(week, user), p);
}
export async function collect(client: Client, week: string) {
  const cycle = await get(client, `week:${week}`);
  if (!cycle) throw new Error("Missing Friday collection cycle");
  for (let i = 0; i < cycle.roster.length; i++) {
    await scheduleOnce(
      client,
      "capture",
      week,
      cycle.roster[i].id,
      10 + i * 15,
    );
  }
}
export async function capture(client: Client, week: string, user: string) {
  const cycle = await get(client, `week:${week}`);
  const p = await get(client, participantKey(week, user));
  if (!cycle || !p) throw new Error("Missing participant collection state");
  if (Date.now() < Date.parse(cycle.cutoff)) {
    throw new Error("Collection cutoff has not arrived");
  }
  if (p.captured) {
    if (p.dm_trigger) {
      await slack(client, "workflows.triggers.delete", {
        trigger_id: p.dm_trigger,
      });
      p.dm_trigger = null;
      await put(client, participantKey(week, user), p);
    }
    if (p.trigger) {
      await slack(client, "workflows.triggers.delete", {
        trigger_id: p.trigger,
      });
      p.trigger = null;
      await put(client, participantKey(week, user), p);
    }
    return;
  }
  let messages: RecordData[] = [];
  p.collection_error = p.root ? null : "Friday prompt was not delivered";
  if (p.root) {
    try {
      messages = await thread(client, p, cycle.cutoff);
    } catch (e) {
      // A failed read is explicitly reported as unavailable, never mistaken for silence.
      p.collection_error = e instanceof Error
        ? e.message
        : "Reflection thread unavailable";
    }
  }
  // Store transcript messages separately to stay below datastore item limits.
  for (const m of messages) {
    await put(client, `message:${week}:${user}:${m.ts}`, m);
  }
  p.message_ids = messages.map((m) => `message:${week}:${user}:${m.ts}`);
  p.captured = true;
  await put(client, participantKey(week, user), p);
  if (p.dm_trigger) {
    await slack(client, "workflows.triggers.delete", {
      trigger_id: p.dm_trigger,
    });
    p.dm_trigger = null;
    await put(client, participantKey(week, user), p);
  }
  if (p.trigger) {
    await slack(client, "workflows.triggers.delete", { trigger_id: p.trigger });
    p.trigger = null;
    await put(client, participantKey(week, user), p);
  }
}
async function listAgent(env: Record<string, string>, path: string) {
  const data: RecordData[] = [];
  let after = "";
  do {
    const r = await openai(
      env,
      `${path}?order=asc&limit=100${
        after ? `&after=${encodeURIComponent(after)}` : ""
      }`,
    );
    data.push(...r.data);
    after = r.has_more ? r.last_id : "";
    if (r.has_more && !after) throw new Error("Incomplete agent pagination");
  } while (after);
  return data;
}
export async function report(
  client: Client,
  env: Record<string, string>,
  week: string,
) {
  const cycle = await get(client, `week:${week}`);
  if (!cycle) throw new Error("Missing Friday collection cycle");
  if (cycle.report_status === "completed") return;
  if (!cycle.report_session) {
    const participants = [];
    for (const u of cycle.roster) {
      const p = await get(client, participantKey(week, u.id));
      if (!p?.captured) {
        throw new Error(
          "Participant collection incomplete; resolve capture failures before reporting",
        );
      }
      const messages = [];
      for (const id of p.message_ids) messages.push(await get(client, id));
      participants.push({
        id: u.id,
        name: u.name,
        collection_error: p.collection_error,
        messages,
        source: p.root
          ? `https://app.slack.com/archives/${p.channel}/p${
            p.root.replace(".", "")
          }`
          : null,
      });
    }
    const previous = [];
    for (let i = 1; i <= 4; i++) {
      const old = await get(client, `week:${addDays(week, -7 * i)}`);
      if (old?.report_status === "completed" && old.analysis) {
        previous.push({ week: old.week, report: old.analysis });
      }
    }
    const c = await get(client, "config");
    const reportInput = { week, cutoff: cycle.cutoff, participants, previous };
    await put(client, `report-input:${week}`, reportInput);
    const s = await openai(env, "sessions", {
      agent: { model: c!.model, tools: [], instructions: REPORT_INSTRUCTIONS },
      environment: { type: "none" },
      input: JSON.stringify(reportInput),
      vault_ids: [],
      metadata: { purpose: "weekly_report", week },
    }, `baxter-report-${week}`);
    cycle.report_session = s.id;
    cycle.report_submitted = true;
    cycle.report_status = "analyzing";
    await put(client, `week:${week}`, cycle);
  }
  if (!cycle.report_submitted) {
    const data = await get(client, `report-input:${week}`);
    await openai(
      env,
      `sessions/${cycle.report_session}/events`,
      inputEvent(JSON.stringify(data)),
      `baxter-report-input-${week}`,
    );
    cycle.report_submitted = true;
    cycle.report_status = "analyzing";
    await put(client, `week:${week}`, cycle);
  }
  await scheduleOnce(client, "finish", week, "", 60);
}
export async function syncState(
  client: Client,
  env: Record<string, string>,
  week: string,
  completed = false,
) {
  const cycle = await get(client, `week:${week}`);
  if (!cycle) throw new Error("Missing workflow state");
  const participants = [];
  for (const u of cycle.roster) {
    const p = await get(client, participantKey(week, u.id));
    participants.push({
      id: u.id,
      name: u.name,
      channel: p?.channel || null,
      root: p?.root || null,
      send_status: p?.status || "pending",
      captured: p?.captured || false,
      collection_error: p?.collection_error || null,
    });
  }
  const blocks = await children(env, cycle.page);
  let state = blocks.find((b) =>
    b.type === "paragraph" &&
    b.paragraph.rich_text.map((t: RecordData) =>
      t.plain_text || t.text?.content
    ).join("").startsWith("Baxter Workflow State\n")
  );
  const stateText = "Baxter Workflow State\n" +
    JSON.stringify({
      week_key: week,
      timezone: "America/New_York",
      cutoff: cycle.cutoff,
      report_status: completed ? "completed" : cycle.report_status,
      participants,
    });
  if (!state) {
    const r = await notion(env, `blocks/${cycle.page}/children`, "PATCH", {
      children: [paragraph(stateText)],
    });
    state = r.results[0];
  } else {await notion(env, `blocks/${state!.id}`, "PATCH", {
      paragraph: { rich_text: rich(stateText) },
    });}
  const verified = await notion(env, `blocks/${state!.id}`);
  if (
    verified.paragraph.rich_text.map((t: RecordData) =>
      t.plain_text || t.text?.content
    ).join("") !== stateText
  ) throw new Error("Workflow state verification failed");
  if (completed) {
    for (
      const b of blocks.filter((b) =>
        b.type === "paragraph" &&
        b.paragraph.rich_text.map((t: RecordData) =>
            t.plain_text || t.text?.content
          ).join("") === "Collection in progress — not a completed report"
      )
    ) {
      await notion(env, `blocks/${b.id}`, "PATCH", {
        paragraph: {
          rich_text: rich("Report completed — see Baxter weekly report below."),
        },
      });
    }
  }
}
export async function finish(
  client: Client,
  env: Record<string, string>,
  week: string,
) {
  const cycle = await get(client, `week:${week}`);
  if (!cycle?.report_session) throw new Error("Missing report session");
  if (cycle.report_status === "completed") return;
  const turns = (await listAgent(env, `sessions/${cycle.report_session}/turns`))
    .filter((t) => !t.subagent_id);
  const last = turns.at(-1);
  if (!last || ["queued", "in_progress"].includes(last.status)) {
    cycle.report_checks = (cycle.report_checks || 0) + 1;
    await put(client, `week:${week}`, cycle);
    if (cycle.report_checks >= 15) {
      throw new Error(
        "Report analysis did not complete; inspect managed agent before retrying",
      );
    }
    await scheduleOnce(client, "finish", week, "", 60);
    return;
  }
  if (last.status !== "completed") {
    throw new Error(`Report agent turn ${last.status}`);
  }
  if (!cycle.analysis) {
    const items = await listAgent(
      env,
      `sessions/${cycle.report_session}/items`,
    );
    const final = items.filter((i) =>
      i.type === "message" && i.role === "assistant" && i.turn_id === last.id &&
      i.phase === "final_answer"
    ).at(-1);
    const text = final?.content.filter((c: RecordData) =>
      c.type === "output_text"
    ).map((c: RecordData) => c.text).join("");
    if (!text) throw new Error("Completed report has no final output");
    const analysis = JSON.parse(text);
    const keys = [
      "Response Rate",
      "Shared Patterns",
      "What's Working",
      "Friction & Blockers",
      "Overlapping Work",
      "AI Opportunity Signals",
      "New Offering Signals",
      "Non-Responders",
      "Voice Responses",
    ];
    if (
      !analysis.properties || keys.some((k) =>
        typeof analysis.properties[k] !== "string"
      ) || Object.keys(analysis.properties).length !== keys.length ||
      typeof analysis.body !== "string"
    ) {
      throw new Error("Report JSON did not match expected fields");
    }
    cycle.analysis = analysis;
    await put(client, `week:${week}`, cycle);
  }
  cycle.url = await writeReport(env, cycle.page, cycle.block, cycle.analysis);
  await syncState(client, env, week, true);
  cycle.report_status = "completed";
  await put(client, `week:${week}`, cycle);
  console.log(
    JSON.stringify({ week, report_status: "completed", url: cycle.url }),
  );
}
