import { type RecordData, REPORTS } from "./common.ts";
export async function notion(
  env: Record<string, string>,
  path: string,
  method = "GET",
  body?: unknown,
) {
  if (!env.NOTION_API_TOKEN) {
    throw new Error("Notion integration secret has not been configured");
  }
  const r = await fetch(`https://api.notion.com/v1/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${env.NOTION_API_TOKEN}`,
      "Notion-Version": "2025-09-03",
      "Content-Type": "application/json",
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(12000),
  });
  if (!r.ok) {
    throw new Error(
      `Notion HTTP ${r.status}; check table access or retry after rate limiting`,
    );
  }
  return await r.json();
}
export const rich = (text: string) => {
  const result = [];
  for (let i = 0; i < text.length; i += 1900) {
    result.push({ type: "text", text: { content: text.slice(i, i + 1900) } });
  }
  return result;
};
export const paragraph = (text: string) => ({
  object: "block",
  type: "paragraph",
  paragraph: { rich_text: rich(text) },
});
export async function children(env: Record<string, string>, id: string) {
  const result: RecordData[] = [];
  let cursor = "";
  do {
    const r = await notion(
      env,
      `blocks/${id}/children?page_size=100${
        cursor ? `&start_cursor=${encodeURIComponent(cursor)}` : ""
      }`,
    );
    result.push(...r.results);
    cursor = r.has_more ? r.next_cursor : "";
  } while (cursor);
  return result;
}
export async function collectionPage(
  env: Record<string, string>,
  week: string,
) {
  const schema = await notion(env, `data_sources/${REPORTS}`);
  if (
    schema.properties?.Name?.type !== "title" ||
    schema.properties?.["Week Of"]?.type !== "date"
  ) {
    throw new Error("Reports table schema changed");
  }
  const matches = await notion(env, `data_sources/${REPORTS}/query`, "POST", {
    filter: { property: "Week Of", date: { equals: week } },
    page_size: 100,
  });
  if (matches.results.length > 1 || matches.has_more) {
    throw new Error("Duplicate weekly report rows; review before continuing");
  }
  if (matches.results.length) return matches.results[0];
  return await notion(env, "pages", "POST", {
    parent: { type: "data_source_id", data_source_id: REPORTS },
    properties: {
      Name: { title: rich(`Week of ${week}`) },
      "Week Of": { date: { start: week } },
    },
    children: [paragraph("Collection in progress — not a completed report")],
  });
}
// Own a dedicated toggle; never replace or delete other content in an existing page.
export async function reportBlock(env: Record<string, string>, page: string) {
  const existing = (await children(env, page)).filter((b) =>
    b.type === "toggle" &&
    b.toggle.rich_text.map((t: RecordData) =>
        t.plain_text || t.text?.content || ""
      ).join("") === "Baxter weekly report"
  );
  if (existing.length > 1) throw new Error("Duplicate managed report sections");
  if (existing.length) {
    const body = await children(env, existing[0].id);
    if (body.length !== 1 || body[0].type !== "paragraph") {
      throw new Error(
        "Managed report section was manually changed; review before overwriting",
      );
    }
    return body[0].id;
  }
  const r = await notion(env, `blocks/${page}/children`, "PATCH", {
    children: [{
      object: "block",
      type: "toggle",
      toggle: {
        rich_text: rich("Baxter weekly report"),
        children: [
          paragraph("Collection in progress — not a completed report"),
        ],
      },
    }],
  });
  return (await children(env, r.results[0].id))[0].id;
}
export async function writeReport(
  env: Record<string, string>,
  page: string,
  block: string,
  report: RecordData,
) {
  const properties: RecordData = {};
  const schema = await notion(env, `data_sources/${REPORTS}`);
  for (const [name, value] of Object.entries(report.properties)) {
    if (
      schema.properties?.[name]?.type !== "rich_text" ||
      typeof value !== "string"
    ) throw new Error(`Invalid report property ${name}`);
    properties[name] = { rich_text: rich(value.slice(0, 6000)) };
  }
  // Record content on the dedicated container itself, avoiding append duplicates after an uncertain write.
  const text = String(report.body);
  if (!text || text.length > 80000) {
    throw new Error("Report body missing or exceeds supported size");
  }
  await notion(env, `blocks/${block}`, "PATCH", {
    paragraph: { rich_text: rich(text) },
  });
  await notion(env, `pages/${page}`, "PATCH", { properties });
  const [verifiedPage, verifiedBlock] = await Promise.all([
    notion(env, `pages/${page}`),
    notion(env, `blocks/${block}`),
  ]);
  for (const name of Object.keys(properties)) {
    if (
      verifiedPage.properties[name].rich_text.map((t: RecordData) =>
        t.plain_text || t.text?.content
      ).join("") !==
        properties[name].rich_text.map((t: RecordData) => t.text.content).join(
          "",
        )
    ) throw new Error("Report property verification failed");
  }
  if (
    verifiedBlock.paragraph.rich_text.map((t: RecordData) =>
      t.plain_text || t.text?.content
    ).join("") !== text
  ) {
    throw new Error("Report body verification failed");
  }
  return verifiedPage.url;
}
