import { localDate, type RecordData } from "./common.ts";
import { notion, paragraph, rich } from "./notion.ts";
import { NTN_DATABASE, NTN_SOURCE, type NtnInsight } from "./ntn_rules.ts";
export const plain = (parts: RecordData[] = []) =>
  parts.map((p) => p.plain_text ?? p.text?.content ?? "").join("");
export async function ntnSchema(env: Record<string, string>) {
  const s = await notion(env, `data_sources/${NTN_SOURCE}`);
  if (
    s.parent?.database_id?.replaceAll("-", "") !==
      NTN_DATABASE.replaceAll("-", "")
  ) throw new Error("Unexpected NTN database");
  const fields: Record<string, string> = {
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
  for (const [k, t] of Object.entries(fields)) {
    if (s.properties?.[k]?.type !== t) {
      throw new Error(`NTN schema mismatch: ${k}`);
    }
  }
  return s;
}
export async function ntnRows(env: Record<string, string>) {
  const rows: RecordData[] = [];
  let cursor = "";
  do {
    const r = await notion(env, `data_sources/${NTN_SOURCE}/query`, "POST", {
      page_size: 100,
      ...(cursor ? { start_cursor: cursor } : {}),
    });
    rows.push(...r.results);
    cursor = r.has_more ? r.next_cursor : "";
    if (r.has_more && !cursor) throw new Error("Incomplete NTN pagination");
    if (rows.length > 3000) throw new Error("NTN table needs indexed lookup");
  } while (cursor);
  return rows;
}
export async function saveInsight(
  env: Record<string, string>,
  i: NtnInsight,
  source: {
    channel: string;
    channel_name?: string;
    ts: string;
    author: string;
    link: string;
  },
  index: number,
) {
  const key = `ntn:slack:${source.channel}:${source.ts}:baxter-${index + 1}`;
  const old = await notion(env, `data_sources/${NTN_SOURCE}/query`, "POST", {
    filter: { property: "Insight Key", rich_text: { equals: key } },
    page_size: 100,
  });
  if (old.has_more || old.results.length > 1) {
    throw new Error("NTN duplicate keys need review");
  }
  if (old.results.length) return old.results[0].url;
  if (
    !/^https:\/\/[a-z0-9-]+\.slack\.com\/archives\/[CG][A-Z0-9]+\/p\d+(?:\?.*)?$/
      .test(source.link)
  ) throw new Error("Invalid NTN Slack permalink");
  const limits =
    "Single Slack message; original NTN interpretation, not a validated empirical result. Source and author checked; client use needs human review.";
  const sourceDate = localDate(new Date(Number(source.ts) * 1000));
  const citation =
    `${source.author}, Now to Next; Slack message, ${sourceDate}. Source access may be restricted.`;
  const properties = {
    Insight: { title: rich(i.title) },
    "NTN Wording": { rich_text: rich(i.takeaway) },
    "NTN Author": { rich_text: rich(source.author) },
    "Insight Type": { select: { name: i.type } },
    "Wording Type": { select: { name: "NTN synthesis" } },
    "Research / Thought / Evidence": {
      rich_text: rich(`NTN-author message interpretation: ${i.takeaway}`),
    },
    "Client Application": { rich_text: rich(i.application) },
    Citations: {
      rich_text: [...rich(citation), {
        type: "text",
        text: { content: " Original NTN message", link: { url: source.link } },
      }],
    },
    "Original Source": { url: source.link },
    "Evidence Type": { select: { name: "Practitioner observation" } },
    "Reuse Status": { select: { name: "Needs verification" } },
    Limitations: { rich_text: rich(limits) },
    "Research Next Step": { rich_text: rich(i.next_step) },
    "Source Date": { date: { start: sourceDate } },
    "Captured On": { date: { start: localDate() } },
    "Insight Key": { rich_text: rich(key) },
  };
  const page = await notion(env, "pages", "POST", {
    parent: { type: "data_source_id", data_source_id: NTN_SOURCE },
    properties,
    children: [
      paragraph(
        "Baxter live NTN capture: sanitized synthesis, pending human source/ownership review.",
      ),
      paragraph(citation),
      paragraph(`Original source: ${source.link}`),
      paragraph(limits),
      paragraph(i.next_step),
    ],
  });
  const checked = await notion(env, `pages/${page.id}`);
  if (
    plain(checked.properties?.["Insight Key"]?.rich_text) !== key ||
    checked.properties?.["Original Source"]?.url !== source.link ||
    plain(checked.properties?.["NTN Wording"]?.rich_text) !== i.takeaway ||
    plain(checked.properties?.["NTN Author"]?.rich_text) !== source.author
  ) throw new Error("NTN write readback failed; reconcile before retrying");
  return checked.url;
}
