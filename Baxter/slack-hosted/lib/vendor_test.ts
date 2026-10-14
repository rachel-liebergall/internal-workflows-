import { deployment } from "../deployment.ts";
import {
  acceptedChannel,
  BAXTER,
  mentionsVendor,
  validateInsights,
  vendorKey,
} from "./vendor_rules.ts";
import { saveInsight, vendorRows, vendorSchema } from "./vendor_notion.ts";
import { vendorCapture, type VendorInput } from "./vendor_capture.ts";
import { type RecordData, TEAM } from "./common.ts";
import trigger from "../triggers/vendor_capture.ts";

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
          user: { real_name: "A Person" },
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
    Vendor: "rich_text",
    Takeaway: "rich_text",
    Type: "select",
    Source: "select",
    "Source Details": "rich_text",
    "Source Date": "date",
    "Source Link": "url",
    "Insight Key": "rich_text",
    "Captured On": "date",
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
          parent: { database_id: deployment.vendorsDatabaseId },
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
    VENDOR_CAPTURE_ENABLED: "true",
    OPENAI_API_KEY: "synthetic",
    NOTION_API_TOKEN: "synthetic",
  };
  const input: VendorInput = {
    op: "capture",
    key: "none",
    channel: "C123",
    channel_type: "public",
    user: "U123",
    text: "Workday credits concern",
    message_ts: "1791913375.849359",
  };
  try {
    await vendorCapture(client, env, TEAM, input);
    assert(sessions === 1 && creates === 0 && scheduled === 1);
    const finish = {
      ...input,
      op: "finish",
      key: "vendor:C123:1791913375.849359",
    };
    await vendorCapture(client, env, TEAM, finish);
    await vendorCapture(client, env, TEAM, finish);
    assert(creates === 1 && state[finish.key].status === "completed");
    assert(!state[finish.key].text);
  } finally {
    globalThis.fetch = original;
  }
});
function assert(value: unknown, message = "Assertion failed") {
  if (!value) throw new Error(message);
}
async function rejects(fn: () => unknown) {
  let threw = false;
  try {
    await fn();
  } catch {
    threw = true;
  }
  assert(threw, "Expected rejection");
}
const insight = {
  title: "Workday pricing concern",
  vendor: "Workday",
  type: "Team perspective",
  takeaway: "The author questions whether credits reflect value.",
  evidence: "Workday credits",
};
Deno.test("Vendor matching handles aliases, boundaries, common words and unknown announcements", () => {
  assert(mentionsVendor("SAP's new direction"));
  assert(mentionsVendor("Findem demo"));
  assert(!mentionsVendor("an example")); // Do not match Ema inside example.
  assert(mentionsVendor("NewCo announced a product"));
  assert(mentionsVendor("AcmeLabs has changed", ["AcmeLabs"]));
});
Deno.test("Trigger covers member channels and excludes DMs and Baxter itself", () => {
  assert(trigger.event.all_resources === true);
  assert(!("channel_ids" in trigger.event));
  assert(JSON.stringify(trigger).includes(BAXTER));
  assert(acceptedChannel("public") && acceptedChannel("private"));
  for (const type of ["im", "mpim", "dm", "mpdm", "unknown"]) {
    assert(!acceptedChannel(type));
  }
});
Deno.test("Analysis requires source-grounded evidence and known types", async () => {
  assert(
    validateInsights({ insights: [insight] }, "Workday credits concern")
      .length === 1,
  );
  assert(validateInsights({ insights: [] }, "hello").length === 0);
  await rejects(() =>
    validateInsights(
      { insights: [{ ...insight, evidence: "invented quote" }] },
      "Workday credits",
    )
  );
  await rejects(() =>
    validateInsights(
      { insights: [{ ...insight, type: "Verified fact" }] },
      "Workday credits",
    )
  );
  await rejects(() =>
    validateInsights({ insights: [insight, insight] }, "Workday credits")
  );
  await rejects(() => vendorKey("D123", "123.456"));
});
Deno.test("Notion pagination refuses incomplete coverage", async () => {
  const original = globalThis.fetch;
  let count = 0;
  globalThis.fetch = () =>
    Promise.resolve(
      Response.json(
        ++count === 1
          ? { results: [{ id: "1" }], has_more: true, next_cursor: "page2" }
          : { results: [{ id: "2" }], has_more: false },
      ),
    );
  try {
    assert((await vendorRows({ NOTION_API_TOKEN: "synthetic" })).length === 2);
  } finally {
    globalThis.fetch = original;
  }
  globalThis.fetch = () =>
    Promise.resolve(Response.json({ results: [], has_more: true }));
  try {
    await rejects(() => vendorRows({ NOTION_API_TOKEN: "synthetic" }));
  } finally {
    globalThis.fetch = original;
  }
});
Deno.test("Notion access/schema failure prevents capture", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = () => Promise.resolve(Response.json({ properties: {} }));
  try {
    await rejects(() => vendorSchema({ NOTION_API_TOKEN: "synthetic" }));
  } finally {
    globalThis.fetch = original;
  }
});
Deno.test("Uncertain Notion creates reconcile the same key on retry without another create", async () => {
  const original = globalThis.fetch;
  const env = { NOTION_API_TOKEN: "synthetic" };
  const source = {
    channel: "C123",
    ts: "1791913375.849359",
    author: "A Person",
    link: "https://example.slack.com/archives/C123/p1791913375849359",
  };
  let existing: RecordData | undefined;
  let creates = 0;
  globalThis.fetch = (_url, options) => {
    const url = String(_url);
    if (url.endsWith("/query")) {
      return Promise.resolve(
        Response.json({ results: existing ? [existing] : [], has_more: false }),
      );
    }
    if (url.endsWith("/pages") && options?.method === "POST") {
      creates++;
      existing = {
        id: "p1",
        url: "https://notion.so/p1",
        properties: JSON.parse(String(options.body)).properties,
      };
      return Promise.reject(new Error("Network response lost after create"));
    }
    throw new Error("Unexpected request");
  };
  try {
    await rejects(() => saveInsight(env, insight, source, 0));
    assert(
      await saveInsight(env, insight, source, 0) === "https://notion.so/p1",
    );
    assert(creates === 1);
  } finally {
    globalThis.fetch = original;
  }
});
Deno.test("Disabled capture, wrong workspaces, DMs and own messages cannot invoke analysis", async () => {
  let calls = 0;
  const client = {
    apiCall(method: string) {
      calls++;
      assert(method === "auth.test");
      return Promise.resolve({ ok: true, user_id: BAXTER, team_id: TEAM });
    },
  };
  const input: VendorInput = {
    op: "capture",
    key: "none",
    channel: "C123",
    channel_type: "public",
    user: "U123",
    text: "Workday credits",
    message_ts: "1791913375.849359",
  };
  await vendorCapture(client, {}, TEAM, input);
  await vendorCapture(client, {}, "OTHER", input);
  assert(calls === 0);
  const env = {
    VENDOR_CAPTURE_ENABLED: "true",
    OPENAI_API_KEY: "synthetic",
    NOTION_API_TOKEN: "synthetic",
  };
  await vendorCapture(client, env, TEAM, { ...input, channel_type: "dm" });
  await vendorCapture(client, env, TEAM, { ...input, user: BAXTER });
  assert(calls === 2);
});
Deno.test("Completed jobs do not restart analysis or schedule more writes", async () => {
  const client = {
    apiCall(method: string) {
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
            payload: JSON.stringify({
              status: "completed",
              names: ["Workday"],
            }),
          },
        });
      }
      throw new Error("Unexpected mutation");
    },
  };
  await vendorCapture(
    client,
    {
      VENDOR_CAPTURE_ENABLED: "true",
      OPENAI_API_KEY: "synthetic",
      NOTION_API_TOKEN: "synthetic",
    },
    TEAM,
    {
      op: "capture",
      key: "none",
      channel: "C123",
      channel_type: "public",
      user: "U123",
      text: "Workday credits",
      message_ts: "1791913375.849359",
    },
  );
});
