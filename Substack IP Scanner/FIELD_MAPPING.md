# Notion field mapping

Destination: **Operations → Knowledge Library → Substack Action Items & Takeaways**. The schema below was inspected on October 14, 2026. Always fetch the live schema before writing; do not create new options to work around a mismatch.

| Property | Type | Required behavior |
| --- | --- | --- |
| Item | Title | Specific takeaway or suggested action |
| Author | Select | Jess or Jason |
| Post | Text | Exact article title |
| Post Date | Date | Verified publication date in America/New_York |
| Source Link | URL | Canonical article URL, without tracking query or fragment |
| Summary | Text | Concise original paraphrase and significance; label inferences |
| Type | Select | One of the five existing types below |
| Next Step | Text | Concrete suggested action; no invented owner or deadline |
| Offering Opportunity | Text | Supported proposed application; empty when unsupported |
| Opportunity Size | Select | High, Medium, Low, or None - Reinforces Existing; empty when evidence is insufficient |
| Status | Status | Not started on new rows; preserve existing statuses |

## Classification

| Type | Use when |
| --- | --- |
| New IP/Offering | A named framework, original concept, or methodology suggests reusable IP |
| Positioning/GTM | A market narrative or positioning angle has a clear application |
| Ops Signal | The post suggests a concrete process or operating change |
| Content Asset | An accessible template, checklist, prompt, or explainer can be reused |
| Tracking Note | Worth tracking without a distinct action, or full content was unavailable |

High requires a clear strategic signal; Medium requires a concrete useful application; Low indicates limited relevance. None - Reinforces Existing means it supports an existing idea without a new opportunity. These labels do not represent revenue forecasts or approval to launch an offering.

## Connector payload shape

The Notion connector uses SQLite-shaped property values. It requires `parent.data_source_id`, obtained from the fetched database's `collection://` URL. The example is synthetic and must not be used as a live test row.

```json
{
  "parent": {"data_source_id": "<configured-data-source-id>"},
  "pages": [{
    "properties": {
      "Item": "Example takeaway",
      "Author": "Jess",
      "Post": "Example article title",
      "date:Post Date:start": "2026-10-14",
      "date:Post Date:is_datetime": 0,
      "Source Link": "https://example.com/example-article",
      "Summary": "An original, evidence-based paraphrase goes here.",
      "Type": "Tracking Note",
      "Next Step": "Read and assess the article.",
      "Offering Opportunity": null,
      "Opportunity Size": null,
      "Status": "Not started"
    }
  }]
}
```

For date-only values, omit `date:Post Date:end`. If publication date cannot be verified, leave it empty and record the limitation instead of guessing. Read the connector's Notion Markdown specification before adding page bodies. Native Notion REST API integrations use a different payload format; do not send this connector example directly to that API.

## Duplicate key and preservation

Compare normalized Source Link + Author + the substance of Item. Multiple distinct items may share an article URL. A URL match alone does not justify duplicating its summary or prove that a previously interrupted multi-item write finished. Query back all candidates after an uncertain write before retrying. Keep existing Status, Next Step, and human-authored text unchanged.
