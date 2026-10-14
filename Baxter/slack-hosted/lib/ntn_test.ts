import { deployment } from "../deployment.ts";
import {
  acceptedChannel,
  BAXTER,
  mentionsNtn,
  ntnKey,
  validateInsights,
} from "./ntn_rules.ts";
import { ntnCapture, type NtnInput } from "./ntn_capture.ts";
import { type RecordData, TEAM } from "./common.ts";
import trigger from "../triggers/ntn_capture.ts";

Deno.test("Capture starts an isolated analysis and finish verifies a single Notion row", async () => {
  const state: Record<string, RecordData> = {};
  let scheduled = 0, sessions = 0, creates = 0;
  let page: RecordData | undefined;
  const client = {
    apiCall(method: string, args: RecordData) {
      if (method === "auth.test") {
        return Promise.resolve({
          ok: true,
          user_id: BAXTER,
          team_id: TEAM,
        });
      }
      if (method === "apps.datastore.get") {
        return Promise.resolve({
          ok: true,
          item: {
            payload: args.datastore === "baxter_reflection_state"
              ? JSON.stringify({ model: "existing-model" })
              : state[args.id]
              ? JSON.stringify(state[args.id])
              : "",
          },
        });
      }
      if (method === "apps.datastore.put") {
        state[args.item.id] = JSON.parse(args.item.payload);
        return Promise.resolve({ ok: true });
      }
      if (method === "conversations.info") {
        return Promise.resolve({
          ok: true,
          channel: { is_member: true, name: "news" },
        });
      }
      if (method === "users.info") {
        return Promise.resolve({
          ok: true,
          user: { real_name: "Jess Von Bank" },
        });
      }
      if (method === "chat.getPermalink") {
        assert(args.channel === "C123" && !("conversation_id" in args));
        return Promise.resolve({
          ok: true,
          permalink:
            "https://example.slack.com/archives/C123/p1791913375849359",
        });
      }
      if (method === "workflows.triggers.create") {
        scheduled++;
        return Promise.resolve({ ok: true, trigger: { id: "FtSynthetic" } });
      }
      throw new Error(`Unexpected Slack call ${method}`);
    },
  };
  const fields = {
    Insight: "title",
    "NTN Wording": "rich_text",
    "NTN Author": "rich_text",
    "Insight Type": "select",
    "Wording Type": "select",
    "Research / Thought / Evidence": "rich_text",
    "Client Application": "rich_text",
    Citations: "rich_text",
    "Original Source": "url",
    "Evidence Type": "select",
    "Reuse Status": "select",
    Limitations: "rich_text",
    "Research Next Step": "rich_text",
    "Source Date": "date",
    "Captured On": "date",
    "Insight Key": "rich_text",
  };
  const original = globalThis.fetch;
  globalThis.fetch = (url, options) => {
    const path = String(url);
    if (path.endsWith("/sessions")) {
      sessions++;
      const body = JSON.parse(String(options?.body));
      assert(
        body.environment.type === "none" && body.vault_ids.length === 0 &&
          body.agent.tools.length === 0,
      );
      return Promise.resolve(Response.json({ id: "sessionSynthetic" }));
    }
    if (path.includes("/turns?")) {
      return Promise.resolve(
        Response.json({
          data: [{ id: "turn1", status: "completed" }],
          has_more: false,
        }),
      );
    }
    if (path.includes("/items?")) {
      return Promise.resolve(Response.json({
        data: [{
          type: "message",
          role: "assistant",
          turn_id: "turn1",
          phase: "final_answer",
          content: [{
            type: "output_text",
            text: JSON.stringify({ insights: [insight] }),
          }],
        }],
        has_more: false,
      }));
    }
    if (path.includes("/data_sources/") && !path.endsWith("/query")) {
      return Promise.resolve(
        Response.json({
          parent: { database_id: deployment.ntnDatabaseId },
          properties: Object.fromEntries(
            Object.entries(fields).map(([k, type]) => [k, { type }]),
          ),
        }),
      );
    }
    if (path.endsWith("/query")) {
      return Promise.resolve(
        Response.json({ results: page ? [page] : [], has_more: false }),
      );
    }
    if (path.endsWith("/pages") && options?.method === "POST") {
      creates++;
      page = {
        id: "page1",
        url: "https://notion.so/page1",
        properties: JSON.parse(String(options.body)).properties,
      };
      return Promise.resolve(Response.json(page));
    }
    if (path.endsWith("/pages/page1")) {
      return Promise.resolve(Response.json(page));
    }
    throw new Error(`Unexpected fetch ${path}`);
  };
  const env = {
    NTN_CAPTURE_ENABLED: "true",
    OPENAI_API_KEY: "synthetic",
    NOTION_API_TOKEN: "synthetic",
  };
  const input: NtnInput = {
    op: "capture",
    key: "none",
    channel: "C123",
    channel_type: "public",
    user: "U123",
    text:
      "Our AI adoption work needs to preserve human judgment and authority.",
    message_ts: "1791913375.849359",
  };
  try {
    await ntnCapture(client, env, TEAM, input);
    assert(sessions === 1 && creates === 0 && scheduled === 1);
    const finish = {
      ...input,
      op: "finish",
      key: "ntn:C123:1791913375.849359",
    };
    await ntnCapture(client, env, TEAM, finish);
    await ntnCapture(client, env, TEAM, finish);
    assert(creates === 1 && state[finish.key].status === "completed");
    assert(!state[finish.key].text);
  } finally {
    globalThis.fetch = original;
  }
});

function assert(v: unknown) {
  if (!v) throw new Error("Assertion failed");
}
const insight = {
  title: "Judgment and authority",
  ntn: "Jess Von Bank",
  type: "NTN point of view",
  takeaway: "Our work design should preserve human judgment.",
  evidence: "human judgment",
  application: "Map human decision rights.",
  next_step: "Proposed research: measure override quality.",
  ownership: "NTN original",
  safe_to_share: true,
};
Deno.test("Reject uncertain ownership, unsafe reuse, forged evidence and empirical overclaim", () => {
  for (
    const row of [
      { ...insight, ownership: "vendor" },
      { ...insight, safe_to_share: false },
      { ...insight, evidence: "invented" },
      { ...insight, ntn: "Other person" },
      { ...insight, type: "NTN original research" },
    ]
  ) {
    let rejected = false;
    try {
      validateInsights({ insights: [row] }, "human judgment", "Jess Von Bank");
    } catch {
      rejected = true;
    }
    assert(rejected);
  }
});
Deno.test("The event scope excludes DMs and the candidate stage can skip logistics", () => {
  assert(!acceptedChannel("dm"));
  assert(acceptedChannel("private"));
  assert(!mentionsNtn("Meeting moved to 2pm"));
  assert(ntnKey("C123", "123.456") === "ntn:C123:123.456");
  assert(JSON.stringify(trigger).includes("data.channel_type}} == private"));
  assert(!JSON.stringify(trigger).includes("== dm"));
});
Deno.test("Disabled NTN feature leaves all existing workflows untouched", async () => {
  await ntnCapture(
    {
      apiCall() {
        throw new Error("Unexpected call");
      },
    },
    {},
    TEAM,
    {
      op: "capture",
      key: "none",
      channel: "C123",
      channel_type: "public",
      user: "U123",
      text:
        "Our AI adoption work needs to preserve human judgment and authority.",
      message_ts: "123.456",
    },
  );
});
