const axios = require("axios");

const NOTION_API_VERSION = "2022-06-28";

// Update these to match your Notion database property names exactly
const NOTION_PROPS = {
  name: "Name",
  dealStage: "Deal Stage",
  description: "Description",
  initialMeetingDate: "Initial Meeting Date",
  contacts: "Contacts",
};

exports.main = async (event, callback) => {
  try {
    const notionApiKey = process.env.NOTION_API_KEY;
    const notionDatabaseId = normalizeNotionDatabaseId(process.env.NOTION_DATABASE_ID);
    const hubspotToken = process.env.HUBSPOT_PRIVATE_APP_TOKEN;

    if (!notionApiKey || !notionDatabaseId) {
      throw new Error("Missing secrets: NOTION_API_KEY, NOTION_DATABASE_ID");
    }

    const notionPageId = getInputField(event, [
      "notion_page_id",
      "notionPageId",
      "notion_page_ID",
    ]);

    if (!notionPageId) {
      throw new Error(
        `Missing notion_page_id. HubSpot sent: ${Object.keys(event.inputFields || {}).join(", ")}`
      );
    }

    const dealId = event.object?.objectId;

    const { data: database } = await axios.get(
      `https://api.notion.com/v1/databases/${notionDatabaseId}`,
      { headers: buildNotionHeaders(notionApiKey) }
    );
    const schema = database.properties;

    const properties = {};

    const dealName = getInputField(event, ["dealname"]);
    if (dealName) {
      properties[NOTION_PROPS.name] = {
        title: [{ text: { content: String(dealName) } }],
      };
    }

    const dealStage = getInputField(event, ["dealstage"]);
    if (dealStage && schema[NOTION_PROPS.dealStage]) {
      properties[NOTION_PROPS.dealStage] = toNotionValue(
        NOTION_PROPS.dealStage,
        schema[NOTION_PROPS.dealStage],
        formatDealStage(dealStage)
      );
    }

    const description = getInputField(event, ["description"]);
    if (description && schema[NOTION_PROPS.description]) {
      properties[NOTION_PROPS.description] = toNotionValue(
        NOTION_PROPS.description,
        schema[NOTION_PROPS.description],
        description
      );
    }

    const meetingDate = getInputField(event, ["initial_meeting_date"]);
    if (meetingDate && schema[NOTION_PROPS.initialMeetingDate]) {
      const isoDate = toIsoDate(meetingDate);
      if (isoDate) {
        properties[NOTION_PROPS.initialMeetingDate] = { date: { start: isoDate } };
      }
    }

    if (hubspotToken && dealId && schema[NOTION_PROPS.contacts]) {
      const contactNames = await fetchAssociatedContactNames(dealId, hubspotToken);
      if (contactNames.length > 0) {
        properties[NOTION_PROPS.contacts] = toNotionValue(
          NOTION_PROPS.contacts,
          schema[NOTION_PROPS.contacts],
          contactNames.join(", ")
        );
      }
    } else if (!hubspotToken) {
      console.warn("HUBSPOT_PRIVATE_APP_TOKEN not set — skipping contacts sync");
    }

    if (Object.keys(properties).length === 0) {
      throw new Error(
        "No fields to update. Check that input fields are mapped in the HubSpot custom code action."
      );
    }

    await axios.patch(
      `https://api.notion.com/v1/pages/${normalizeNotionPageId(notionPageId)}`,
      { properties },
      { headers: buildNotionHeaders(notionApiKey) }
    );

    callback({
      outputFields: {
        updatedNotionPageId: normalizeNotionPageId(notionPageId),
        updatedFields: Object.keys(properties).join(", "),
      },
    });
  } catch (error) {
    console.error("Failed to update Notion page:", getErrorDetails(error));
    throw error;
  }
};

async function fetchAssociatedContactNames(dealId, hubspotToken) {
  try {
    const headers = { Authorization: `Bearer ${hubspotToken}` };

    const { data: assocData } = await axios.get(
      `https://api.hubapi.com/crm/v3/objects/deals/${dealId}/associations/contacts`,
      { headers }
    );

    const contactIds = (assocData.results || []).map((r) => r.id);
    if (contactIds.length === 0) return [];

    const { data: batchData } = await axios.post(
      "https://api.hubapi.com/crm/v3/objects/contacts/batch/read",
      {
        properties: ["firstname", "lastname"],
        inputs: contactIds.map((id) => ({ id })),
      },
      { headers }
    );

    return (batchData.results || [])
      .map((c) => {
        const p = c.properties || {};
        return [p.firstname, p.lastname].filter(Boolean).join(" ");
      })
      .filter(Boolean);
  } catch (err) {
    console.warn("Could not fetch contacts:", err.message);
    return [];
  }
}

function toIsoDate(value) {
  if (!value) return null;
  const num = Number(value);
  if (!isNaN(num) && num > 1_000_000_000) {
    return new Date(num).toISOString().split("T")[0];
  }
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d.toISOString().split("T")[0];
}

function getInputField(event, possibleNames) {
  const inputFields = event.inputFields || {};
  for (const name of possibleNames) {
    if (inputFields[name] !== undefined && inputFields[name] !== null && inputFields[name] !== "") {
      return inputFields[name];
    }
  }
  return undefined;
}

function buildNotionHeaders(notionApiKey) {
  return {
    Authorization: `Bearer ${notionApiKey}`,
    "Content-Type": "application/json",
    "Notion-Version": NOTION_API_VERSION,
  };
}

function toNotionValue(propertyName, propertySchema, value) {
  if (!propertySchema) {
    throw new Error(
      `Notion database is missing property "${propertyName}". Check the field name in NOTION_PROPS.`
    );
  }

  switch (propertySchema.type) {
    case "title":
      return { title: [{ text: { content: String(value) } }] };
    case "select":
      return {
        select: {
          name: getMatchingOptionName(propertySchema.select.options, value, propertyName),
        },
      };
    case "status":
      return {
        status: {
          name: getMatchingOptionName(propertySchema.status.options, value, propertyName),
        },
      };
    case "rich_text":
      return { rich_text: [{ text: { content: String(value) } }] };
    case "multi_select":
      return {
        multi_select: String(value)
          .split(",")
          .map((v) => ({ name: v.trim() }))
          .filter((v) => v.name),
      };
    case "date":
      return { date: { start: String(value) } };
    default:
      throw new Error(
        `Unsupported Notion property type "${propertySchema.type}" for "${propertyName}".`
      );
  }
}

function formatDealStage(dealStage) {
  const knownHubSpotStages = {
    appointmentscheduled: "Appointment Scheduled",
    initialmeetingscheduled: "Initial Meeting Scheduled",
    qualifiedtobuy: "Qualified To Buy",
    presentationscheduled: "Presentation Scheduled",
    decisionmakerboughtin: "Decision Maker Bought In",
    contractsent: "Contract Sent",
    proposalsent: "Proposal",
    proposal: "Proposal",
    closedwon: "Closed Won",
    closedlost: "Closed Lost",
  };

  const rawValue = String(dealStage || "");
  const normalizedValue = normalizeOptionName(rawValue);
  return knownHubSpotStages[normalizedValue] || titleize(rawValue);
}

function getMatchingOptionName(options, value, propertyName) {
  const readableValue = String(value);
  const normalizedValue = normalizeOptionName(readableValue);
  const match = options.find((o) => normalizeOptionName(o.name) === normalizedValue);
  return match ? match.name : readableValue;
}

function normalizeNotionDatabaseId(databaseIdOrUrl) {
  const match = String(databaseIdOrUrl || "").match(/[0-9a-fA-F]{32}/);
  if (!match) return databaseIdOrUrl;
  const id = match[0];
  return [id.slice(0, 8), id.slice(8, 12), id.slice(12, 16), id.slice(16, 20), id.slice(20)].join("-");
}

function normalizeNotionPageId(pageIdOrUrl) {
  const match = String(pageIdOrUrl || "").match(/[0-9a-fA-F]{32}/);
  if (!match) return pageIdOrUrl;
  const id = match[0];
  return [id.slice(0, 8), id.slice(8, 12), id.slice(12, 16), id.slice(16, 20), id.slice(20)].join("-");
}

function normalizeOptionName(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]/g, "");
}

function titleize(value) {
  return String(value)
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .trim()
    .replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}

function getErrorDetails(error) {
  if (error.response) {
    return { status: error.response.status, data: error.response.data };
  }
  return error.message;
}
