import { deployment } from "../deployment.ts";
// All persistent state and event scheduling live in Slack.
export const TEAM = deployment.teamId;
export const RACHEL = deployment.pilotUserId;
export const PROJECT = deployment.openaiProjectId;
export const REPORTS = deployment.reportsDataSourceId;
export const STORE = "baxter_reflection_state";
// deno-lint-ignore no-explicit-any
export type Client = any;
// deno-lint-ignore no-explicit-any
export type RecordData = Record<string, any>;
export async function slack(
  client: Client,
  method: string,
  args: RecordData = {},
) {
  const r = await client.apiCall(method, args);
  if (!r.ok) throw new Error(`${method}: ${r.error ?? "failed"}`);
  return r;
}
export async function get(
  client: Client,
  id: string,
): Promise<RecordData | null> {
  const r = await client.apiCall("apps.datastore.get", {
    datastore: STORE,
    id,
  });
  if (!r.ok && r.error === "datastore_item_not_found") return null;
  if (!r.ok) throw new Error(`datastore.get: ${r.error}`);
  return r.item?.payload ? JSON.parse(r.item.payload) : null;
}
export async function put(client: Client, id: string, data: RecordData) {
  const payload = JSON.stringify(data);
  if (new TextEncoder().encode(payload).length > 380000) {
    throw new Error(
      "Reflection state exceeds storage limit; review before continuing",
    );
  }
  await slack(client, "apps.datastore.put", {
    datastore: STORE,
    item: { id, payload },
  });
}
export async function openai(
  env: Record<string, string>,
  path: string,
  body?: unknown,
  key?: string,
) {
  const r = await fetch(`https://api.openai.com/v1/agents/${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
      "OpenAI-Beta": "agents=v1",
      "OpenAI-Project": PROJECT,
      ...(key ? { "Idempotency-Key": key } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(22000),
  });
  if (!r.ok) {
    let code = "unknown";
    let detail = "";
    try {
      const failure = (await r.json())?.error;
      code = String(failure?.code ?? "unknown");
      if (typeof failure?.message === "string") {
        detail = failure.message
          .replaceAll(env.OPENAI_API_KEY || "__no_key__", "[redacted]")
          .replaceAll(env.NOTION_API_TOKEN || "__no_notion_key__", "[redacted]")
          .replace(/(?:sk-|xox[baprs]-)[A-Za-z0-9_-]+/g, "[redacted]")
          .slice(0, 500);
      }
    } catch { /* no raw bodies */ }
    throw new Error(
      `OpenAI HTTP ${r.status}, code ${
        code.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 80)
      }${detail ? `: ${detail}` : ""}`,
    );
  }
  const text = await r.text();
  return text.trim() ? JSON.parse(text) : {};
}
export const inputEvent = (text: string) => ({
  events: [{
    type: "agent.session.input.message",
    input: [{ role: "user", content: [{ type: "input_text", text }] }],
  }],
});
export function localDate(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
export function addDays(date: string, days: number) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
export function monday(date: string) {
  return addDays(date, -((new Date(date + "T12:00:00Z").getUTCDay() + 6) % 7));
}
export function easternTime(date: string, hour: number) {
  const offset = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    timeZoneName: "shortOffset",
  })
    .formatToParts(new Date(date + "T12:00:00Z")).find((p) =>
      p.type === "timeZoneName"
    )!.value;
  const hours = Number(offset.replace("GMT", "")) || 0;
  return new Date(
    Date.UTC(...[
      ...date.split("-").map(Number).map((v, i) => i === 1 ? v - 1 : v),
      hour - hours,
    ] as [number, number, number, number]),
  ).toISOString();
}
export function eligible(user: RecordData, bot: string) {
  return Boolean(
    user.id && user.id !== bot && user.id !== "USLACKBOT" &&
      user.id !== deployment.excludedUserId &&
      !user.deleted && !user.is_bot && !user.is_app_user &&
      !user.is_restricted && !user.is_ultra_restricted,
  );
}
export async function roster(client: Client, bot: string) {
  const users: RecordData[] = [];
  let cursor = "";
  do {
    const r = await slack(client, "users.list", {
      limit: 200,
      ...(cursor ? { cursor } : {}),
    });
    users.push(...r.members.filter((u: RecordData) => eligible(u, bot)));
    cursor = r.response_metadata?.next_cursor ?? "";
  } while (cursor);
  return users.map((u) => ({
    id: u.id,
    name: u.profile?.real_name || u.real_name || u.name,
    first: u.profile?.first_name ||
      (u.profile?.real_name || u.real_name || u.name).split(" ")[0],
  }));
}
export async function scheduleOnce(
  client: Client,
  op: string,
  week: string,
  user = "",
  delay = 10,
) {
  return await slack(client, "workflows.triggers.create", {
    type: "scheduled",
    name: `Baxter ${op} ${week} ${user}`,
    workflow: "#/workflows/baxter_maintenance",
    inputs: {
      op: { value: op },
      week: { value: week },
      user: { value: user || "none" },
    },
    schedule: {
      start_time: new Date(Date.now() + delay * 1000).toISOString(),
      frequency: { type: "once" },
    },
  });
}
export const participantKey = (week: string, user: string) =>
  `participant:${week}:${user}`;
export function scheduledWeek(op: string, now = new Date()) {
  const date = localDate(now);
  const day = new Date(date + "T12:00:00Z").getUTCDay();
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      hour: "numeric",
      hourCycle: "h23",
    }).format(now),
  );
  if (op === "start" && day === 5 && hour === 14) return monday(date);
  if (op === "collect" && day === 1 && hour === 9) return addDays(date, -7);
  if (op === "report" && day === 1 && hour === 10) return addDays(date, -7);
  return null;
}
export async function thread(client: Client, p: RecordData, cutoff: string) {
  const messages: RecordData[] = [];
  const roots = [
    ...new Set([p.root, ...(p.dm_messages || []).map((m: RecordData) => m.ts)]),
  ];
  for (const root of roots) {
    let cursor = "";
    do {
      const r = await slack(client, "conversations.replies", {
        channel: p.channel,
        ts: root,
        limit: 100,
        include_all_metadata: true,
        ...(cursor ? { cursor } : {}),
      });
      messages.push(
        ...r.messages.filter((m: RecordData) =>
          Number(m.ts) < Date.parse(cutoff) / 1000
        ),
      );
      cursor = r.response_metadata?.next_cursor || "";
      if (r.has_more && !cursor) {
        throw new Error("Incomplete reflection thread pagination");
      }
    } while (cursor);
  }
  const recorded = messages.filter((m) => m.user === p.user || m.user === p.bot)
    .map(
      (m) => ({
        ts: m.ts,
        thread_ts: m.thread_ts || m.ts,
        author: m.user === p.user ? "participant" : "baxter",
        text: m.text || "",
        kind: m.metadata?.event_payload?.kind || "",
        files: (m.files || []).map((f: RecordData) => ({
          id: f.id,
          mimetype: f.mimetype,
          name: f.name,
        })),
        edited_after_cutoff: Boolean(
          m.edited && Number(m.edited.ts) >= Date.parse(cutoff) / 1000,
        ),
      }),
    );
  const merged = [
    ...(p.dm_messages || []).filter((m: RecordData) =>
      Number(m.ts) > Number(p.root) && Number(m.ts) < Date.parse(cutoff) / 1000
    ),
    ...recorded,
  ];
  return [...new Map(merged.map((m: RecordData) => [m.ts, m])).values()].sort((
    a,
    b,
  ) => Number(a.ts) - Number(b.ts));
}
