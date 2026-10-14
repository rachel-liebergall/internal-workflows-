import { localDate, type RecordData } from "./common.ts";
import { notion, paragraph, rich } from "./notion.ts";
import {
  VENDOR_DATABASE,
  VENDOR_SOURCE,
  type VendorInsight,
} from "./vendor_rules.ts";
export const plain = (parts: RecordData[] = []) =>
  parts.map((p) => p.plain_text ?? p.text?.content ?? "").join("");
export async function vendorSchema(env: Record<string, string>) {
  const schema = await notion(env, `data_sources/${VENDOR_SOURCE}`);
  if (
    schema.parent?.database_id?.replaceAll("-", "") !==
      VENDOR_DATABASE.replaceAll("-", "")
  ) throw new Error("Unexpected vendor database");
  const fields: Record<string, string> = {
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
  for (const [name, type] of Object.entries(fields)) {
    if (schema.properties?.[name]?.type !== type) {
      throw new Error(`Vendor schema mismatch: ${name}`);
    }
  }
  return schema;
}
export async function vendorRows(env: Record<string, string>) {
  const rows: RecordData[] = [];
  let cursor = "";
  do {
    const result = await notion(
      env,
      `data_sources/${VENDOR_SOURCE}/query`,
      "POST",
      {
        page_size: 100,
        ...(cursor ? { start_cursor: cursor } : {}),
      },
    );
    rows.push(...result.results);
    cursor = result.has_more ? result.next_cursor : "";
    if (result.has_more && !cursor) {
      throw new Error("Incomplete vendor row pagination");
    }
    if (rows.length > 3000) {
      throw new Error(
        "Vendor table requires indexed lookup before further expansion",
      );
    }
  } while (cursor);
  return rows;
}
export async function saveInsight(
  env: Record<string, string>,
  item: VendorInsight,
  source: {
    channel: string;
    channel_name?: string;
    ts: string;
    author: string;
    link: string;
  },
  index: number,
) {
  const key = `slack:${source.channel}:${source.ts}:baxter-${index + 1}`;
  const existing = await notion(
    env,
    `data_sources/${VENDOR_SOURCE}/query`,
    "POST",
    {
      filter: { property: "Insight Key", rich_text: { equals: key } },
      page_size: 100,
    },
  );
  if (existing.has_more || existing.results.length > 1) {
    throw new Error("Duplicate vendor keys require review");
  }
  // Reconcile an uncertain prior create rather than blindly creating another row.
  if (existing.results.length) return existing.results[0].url;
  if (
    !/^https:\/\/[a-z0-9-]+\.slack\.com\/archives\/[CG][A-Z0-9]+\/p\d+(?:\?.*)?$/
      .test(source.link)
  ) {
    throw new Error("Invalid Slack permalink");
  }
  const sourceDate = localDate(new Date(Number(source.ts) * 1000));
  const properties = {
    Insight: { title: rich(item.title) },
    Vendor: { rich_text: rich(item.vendor) },
    Takeaway: { rich_text: rich(item.takeaway) },
    Type: { select: { name: item.type } },
    Source: { select: { name: "Slack" } },
    "Source Details": {
      rich_text: rich(
        `#${
          source.channel_name || source.channel
        } — ${source.author} — message evidence`,
      ),
    },
    "Source Date": { date: { start: sourceDate } },
    "Source Link": { url: source.link },
    "Insight Key": { rich_text: rich(key) },
    "Captured On": { date: { start: localDate() } },
  };
  const page = await notion(env, "pages", "POST", {
    parent: { type: "data_source_id", data_source_id: VENDOR_SOURCE },
    properties,
    children: [
      paragraph(item.takeaway),
      paragraph(`Source: ${source.link}`),
      paragraph(`Evidence from original message: ${item.evidence}`),
      paragraph(
        "Captured by Baxter from the Slack message. Claims and opinions remain attributed; external links and product availability were not independently verified.",
      ),
    ],
  });
  const readback = await notion(env, `pages/${page.id}`);
  if (
    plain(readback.properties?.["Insight Key"]?.rich_text) !== key ||
    readback.properties?.["Source Link"]?.url !== source.link ||
    plain(readback.properties?.Insight?.title) !== item.title ||
    plain(readback.properties?.Takeaway?.rich_text) !== item.takeaway
  ) {
    throw new Error("Vendor write readback failed; reconcile before retrying");
  }
  return readback.url;
}
