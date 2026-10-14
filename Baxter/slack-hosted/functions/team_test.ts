import { deployment } from "../deployment.ts";
import { dmTrigger } from "../lib/dm_trigger.ts";
import {
  easternTime,
  eligible,
  type RecordData,
  scheduledWeek,
  thread,
} from "../lib/common.ts";
import { weeklyTrigger } from "../triggers/weekly.ts";
import { dispatch } from "../lib/cycle.ts";
import { teamReply } from "./team_reply.ts";
function assert(v: unknown, message = "Assertion failed") {
  if (!v) throw new Error(message);
}
function fake(
  initial: Record<string, RecordData>,
  respond?: (m: string, a: RecordData) => RecordData,
) {
  const store = structuredClone(initial);
  const calls: { method: string; args: RecordData }[] = [];
  return {
    store,
    calls,
    apiCall(method: string, args: RecordData) {
      calls.push({ method, args });
      if (method === "apps.datastore.get") {
        return Promise.resolve({
          ok: true,
          item: {
            payload: store[args.id] ? JSON.stringify(store[args.id]) : "",
          },
        });
      }
      if (method === "apps.datastore.put") {
        store[args.item.id] = JSON.parse(args.item.payload);
        return Promise.resolve({ ok: true });
      }
      return Promise.resolve(
        respond?.(method, args) || { ok: false, error: "unexpected_call" },
      );
    },
  };
}
const week = "2026-10-12", user = "U_ONE", bot = "U_BOT";
const cycle = { roster: [{ id: user }], cutoff: "2099-10-19T13:00:00Z" };
const p = {
  week,
  user,
  bot,
  channel: "D_ONE",
  root: "1792000000.000001",
  session: "sess_fake",
  routing_version: 2,
  trigger: "Ft_fake",
  dm_trigger: "Ft_dm_fake",
  status: "sent",
};
const initial = { [`week:${week}`]: cycle, [`participant:${week}:${user}`]: p };
const env = { TEAM_ENABLED: "true", OPENAI_API_KEY: "synthetic" };
const input = {
  week,
  user,
  channel: p.channel,
  thread_ts: p.root,
  text: "The audience kept changing.",
  message_ts: "1792000001.000001",
};

Deno.test("Eastern schedule stays local across DST, with Monday cutoff on the prior cycle", () => {
  assert(easternTime("2026-10-16", 14) === "2026-10-16T18:00:00.000Z");
  assert(easternTime("2026-11-06", 14) === "2026-11-06T19:00:00.000Z");
  assert(
    scheduledWeek("collect", new Date("2026-10-19T13:00:00Z")) === "2026-10-12",
  );
  assert(scheduledWeek("start", new Date("2026-10-16T17:00:00Z")) === null);
  const now = new Date("2026-10-11T18:00:00Z");
  assert(
    weeklyTrigger("start", now).schedule.start_time ===
      "2026-10-16T18:00:00.000Z",
  );
  assert(
    weeklyTrigger("report", now).schedule.start_time ===
      "2026-10-19T14:00:00.000Z",
  );
});
Deno.test("Roster excludes guests, bots, deleted users and service accounts", () => {
  assert(eligible({ id: user }, bot));
  for (
    const u of [
      { id: bot },
      { id: "USLACKBOT" },
      { id: deployment.excludedUserId },
      { id: user, deleted: true },
      { id: user, is_bot: true },
      { id: user, is_app_user: true },
      { id: user, is_restricted: true },
      { id: user, is_ultra_restricted: true },
    ]
  ) {
    assert(!eligible(u, bot));
  }
});
Deno.test("Team relay ignores another thread, participant, workspace and closed cycles", async () => {
  const client = fake(initial);
  const saved = globalThis.fetch;
  globalThis.fetch = () => {
    throw new Error("Unauthorized network request");
  };
  try {
    await teamReply(client, env, "T_OTHER", input);
    await teamReply(
      client,
      { ...env, TEAM_ENABLED: "false" },
      deployment.teamId,
      input,
    );
    await teamReply(client, env, deployment.teamId, {
      ...input,
      thread_ts: "OTHER",
    });
    await teamReply(client, env, deployment.teamId, {
      ...input,
      user: "U_OTHER",
    });
    await teamReply(client, env, deployment.teamId, {
      ...input,
      channel: "D_OTHER",
    });
    client.store[`week:${week}`].cutoff = "2020-01-01T00:00:00Z";
    await teamReply(client, env, deployment.teamId, input);
  } finally {
    globalThis.fetch = saved;
  }
});
Deno.test("Valid team messages route to isolated session with repeatable idempotency", async () => {
  const client = fake(initial, () => ({ ok: true, messages: [] }));
  const saved = globalThis.fetch;
  const keys: string[] = [];
  globalThis.fetch = (url, options) => {
    assert(String(url).endsWith("/sessions/sess_fake/events"));
    keys.push(new Headers(options?.headers).get("Idempotency-Key")!);
    assert(
      JSON.parse(String(options?.body)).events[0].input[0].content[0].text
        .includes(input.text),
    );
    return Promise.resolve(new Response(null, { status: 202 }));
  };
  try {
    await teamReply(client, env, deployment.teamId, input);
    await teamReply(client, env, deployment.teamId, input);
  } finally {
    globalThis.fetch = saved;
  }
  assert(keys.length === 2 && keys[0] === keys[1]);
});
Deno.test("Recovered Friday prompt and rerun do not send a duplicate", async () => {
  const state: Record<string, RecordData> = structuredClone(initial);
  delete state[`participant:${week}:${user}`].root;
  const client = fake(state, (m) => {
    if (m === "conversations.replies") return { ok: true, messages: [] };
    assert(m === "conversations.history");
    return {
      ok: true,
      messages: [{
        user: bot,
        ts: p.root,
        metadata: {
          event_type: "ntn_reflection_prompt",
          event_payload: { week_key: week },
        },
      }],
    };
  });
  await dispatch(client, env, week, user);
  await dispatch(client, env, week, user);
  assert(client.store[`participant:${week}:${user}`].root === p.root);
  assert(!client.calls.some((c) => c.method === "chat.postMessage"));
});
Deno.test("Thread collection paginates, excludes cutoff and strangers, and flags late edits", async () => {
  const cutoff = "2026-10-19T13:00:00Z", boundary = Date.parse(cutoff) / 1000;
  const client = fake({}, (_m, args) =>
    args.cursor
      ? {
        ok: true,
        messages: [
          {
            user,
            ts: String(boundary - 1),
            text: "Answer",
            edited: { ts: String(boundary + 5) },
          },
          { user: "U_OTHER", ts: String(boundary - 2), text: "Other person" },
          { user, ts: String(boundary), text: "Too late" },
        ],
      }
      : {
        ok: true,
        messages: [
          { user: bot, ts: p.root, text: "Prompt" },
        ],
        has_more: true,
        response_metadata: { next_cursor: "next" },
      });
  const messages = await thread(client, p, cutoff);
  assert(
    messages.length === 2 && messages[1].edited_after_cutoff &&
      client.calls.length === 2,
  );
});

Deno.test("Main DM replies persist once and reach the agent; old messages are ignored", async () => {
  const client = fake(initial, () => ({ ok: true, messages: [] }));
  const saved = globalThis.fetch;
  let forwarded = 0;
  globalThis.fetch = (_url, options) => {
    forwarded++;
    assert(String(options?.body).includes("accepted_main_dm_context"));
    assert(String(options?.body).includes(`reply_thread ${input.message_ts}`));
    return Promise.resolve(new Response(null, { status: 202 }));
  };
  try {
    await teamReply(client, env, deployment.teamId, {
      ...input,
      main_dm: true,
    });
    await teamReply(client, env, deployment.teamId, {
      ...input,
      main_dm: true,
    });
    await teamReply(client, env, deployment.teamId, {
      ...input,
      main_dm: true,
      message_ts: "1.000001",
    });
    assert(forwarded === 2);
    assert(
      client.store[`participant:${week}:${user}`].dm_messages.length === 1,
    );
    const collected = await thread(
      fake({}, () => ({ ok: true, messages: [] })),
      client.store[`participant:${week}:${user}`],
      cycle.cutoff,
    );
    assert(collected.length === 1 && collected[0].author === "participant");
  } finally {
    globalThis.fetch = saved;
  }
});

Deno.test("Main-DM trigger uses Slack-supported string and null equality, leaving timestamp checks to the handler", () => {
  const t = dmTrigger(p, week, user);
  assert(
    t.event.channel_ids.length === 1 && t.event.channel_ids[0] === p.channel,
  );
  const statements = t.event.filter.root.inputs.map((
    i: { statement: string },
  ) => i.statement);
  assert(statements.length === 2);
  assert(statements.includes(`{{data.user_id}} == ${user}`));
  assert(statements.includes("{{data.thread_ts}} == null"));
  assert(
    t.inputs.main_dm.value === true && t.inputs.thread_ts.value === p.root,
  );
});

Deno.test("Replies in a participant's main-DM message thread stay in that thread", async () => {
  const state: Record<string, RecordData> = structuredClone(initial);
  state[`participant:${week}:${user}`].dm_messages = [{
    ts: input.message_ts,
    author: "participant",
    text: input.text,
  }];
  const client = fake(state, () => ({ ok: true, messages: [] }));
  const saved = globalThis.fetch;
  let accepted = false;
  globalThis.fetch = (_url, options) => {
    assert(String(options?.body).includes(`reply_thread ${input.message_ts}`));
    accepted = true;
    return Promise.resolve(new Response(null, { status: 202 }));
  };
  try {
    await teamReply(client, env, deployment.teamId, {
      ...input,
      thread_ts: input.message_ts,
      message_ts: "1792000002.000001",
    });
  } finally {
    globalThis.fetch = saved;
  }
  assert(accepted);
});
