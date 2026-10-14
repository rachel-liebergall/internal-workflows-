import { collectionPage, writeReport } from "./notion.ts";
import { finish, report } from "./cycle.ts";
import { type RecordData } from "./common.ts";
function assert(v: unknown) {
  if (!v) throw new Error("Assertion failed");
}
const env = {
  NOTION_API_TOKEN: "synthetic-notion",
  OPENAI_API_KEY: "synthetic-openai",
};
const json = (data: unknown) =>
  Promise.resolve(
    new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    }),
  );
Deno.test("Conversation-only report sessions include initial evidence and never submit it twice", async () => {
  const saved = globalThis.fetch;
  const state: RecordData = {
    "week:2026-10-12": {
      week: "2026-10-12",
      cutoff: "2026-10-19T13:00:00Z",
      roster: [],
      report_status: "collecting",
    },
    config: { model: "synthetic-model" },
  };
  let creates = 0, extraInputs = 0;
  const client = {
    apiCall(method: string, args: RecordData) {
      if (method === "apps.datastore.get") {
        return Promise.resolve({
          ok: true,
          item: state[args.id]
            ? { payload: JSON.stringify(state[args.id]) }
            : undefined,
        });
      }
      if (method === "apps.datastore.put") {
        state[args.item.id] = JSON.parse(
          args.item.payload,
        );
      }
      return Promise.resolve({
        ok: true,
        trigger: { id: "synthetic-trigger" },
      });
    },
  };
  globalThis.fetch = (url, options) => {
    if (String(url).endsWith("/sessions")) {
      creates++;
      const body = JSON.parse(String(options?.body));
      assert(
        body.environment.type === "none" &&
          JSON.parse(body.input).week === "2026-10-12",
      );
      return json({ id: "sess_synthetic" });
    }
    extraInputs++;
    return json({});
  };
  try {
    await report(client, env, "2026-10-12");
    await report(client, env, "2026-10-12");
  } finally {
    globalThis.fetch = saved;
  }
  assert(
    creates === 1 && extraInputs === 0 &&
      state["week:2026-10-12"].report_submitted === true,
  );
});
Deno.test("Duplicate weekly rows stop before creating or writing a report", async () => {
  const saved = globalThis.fetch;
  let writes = 0;
  globalThis.fetch = (url, options) => {
    if (String(url).endsWith("/query")) {
      return json({ results: [{ id: "one" }, { id: "two" }], has_more: false });
    }
    if (options?.method !== "GET") writes++;
    return json({
      properties: { Name: { type: "title" }, "Week Of": { type: "date" } },
    });
  };
  let failure = false;
  try {
    await collectionPage(env, "2026-10-12");
  } catch {
    failure = true;
  } finally {
    globalThis.fetch = saved;
  }
  assert(failure && writes === 0);
});
Deno.test("Report retries update the same managed block without appending duplicate content", async () => {
  const saved = globalThis.fetch;
  const methods: string[] = [];
  let body: RecordData = {}, props: RecordData = {};
  globalThis.fetch = (url, options) => {
    const path = new URL(String(url)).pathname;
    methods.push(`${options?.method} ${path}`);
    if (path.includes("data_sources/")) {
      return json({ properties: { "Shared Patterns": { type: "rich_text" } } });
    }
    if (options?.method === "PATCH") {
      if (path.includes("blocks/")) body = JSON.parse(String(options.body));
      else props = JSON.parse(String(options.body)).properties;
      return json({});
    }
    return path.includes("blocks/")
      ? json(body)
      : json({ properties: props, url: "https://notion.so/weekly-page" });
  };
  try {
    const report = {
      properties: { "Shared Patterns": "Audience decisions need agreement." },
      body: "Evidence from two people; try a shared brief.",
    };
    assert(
      await writeReport(env, "page", "body-block", report) ===
        "https://notion.so/weekly-page",
    );
    await writeReport(env, "page", "body-block", report);
  } finally {
    globalThis.fetch = saved;
  }
  assert(!methods.some((m) => m.startsWith("POST") || m.endsWith("/children")));
});
Deno.test("A Notion verification failure cannot mark the weekly report completed", async () => {
  const saved = globalThis.fetch;
  const cycle: RecordData = {
    report_session: "sess_report",
    report_status: "analyzing",
    page: "page",
    block: "body",
    analysis: {
      properties: { "Shared Patterns": "Expected text" },
      body: "Expected report",
    },
  };
  let stateWrites = 0;
  const client = {
    apiCall(method: string) {
      if (method === "apps.datastore.put") stateWrites++;
      return Promise.resolve({
        ok: true,
        item: { payload: JSON.stringify(cycle) },
      });
    },
  };
  globalThis.fetch = (url, options) => {
    const path = new URL(String(url)).pathname;
    if (path.endsWith("/turns")) {
      return json({
        data: [{ id: "turn_one", status: "completed", subagent_id: null }],
        has_more: false,
      });
    }
    if (path.includes("data_sources/")) {
      return json({ properties: { "Shared Patterns": { type: "rich_text" } } });
    }
    if (options?.method === "PATCH") return json({});
    return path.includes("blocks/")
      ? json({ paragraph: { rich_text: [] } })
      : json({ properties: { "Shared Patterns": { rich_text: [] } } });
  };
  let failure = false;
  try {
    await finish(client, env, "2026-10-12");
  } catch {
    failure = true;
  } finally {
    globalThis.fetch = saved;
  }
  assert(failure && stateWrites === 0 && cycle.report_status === "analyzing");
});
