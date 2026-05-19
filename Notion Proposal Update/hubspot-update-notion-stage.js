const axios = require("axios");

const NOTION_API_VERSION = "2022-06-28";

// Use this in a second HubSpot workflow, for example:
// Deal stage is Proposal AND Notion Page ID is known.
exports.main = async (event, callback) => {
  try {
    const notionApiKey = process.env.NOTION_API_KEY;
    const notionDatabaseId = normalizeNotionDatabaseId(process.env.NOTION_DATABASE_ID);

    if (!notionApiKey || !notionDatabaseId) {
      throw new Error(
        "Missing HubSpot secrets. Add NOTION_API_KEY and NOTION_DATABASE_ID to the custom code action."
      );
    }

    const dealStage = formatDealStage(
      getInputField(event, ["target_deal_stage"]) ||
        process.env.TARGET_DEAL_STAGE ||
        "Proposal"
    );

    // Best path: save notionPageId from the first workflow back onto the HubSpot deal,
    // then include that property here as notion_page_id.
    let notionPageId = getInputField(event, [
      "notion_page_id",
      "notionPageId",
      "notion_page",
      "notion_page_id_",
      "notion_page_ID",
      "notion_page_url",
      "notionPageUrl",
    ]);

    if (!notionPageId) {
      const receivedFields = Object.keys(event.inputFields || {});
      throw new Error(
        `Missing required HubSpot input field: notion_page_id. Map this to the deal property that stores notionPageId from the first workflow. HubSpot sent these input field keys: ${receivedFields.join(", ")}`
      );
    }

    const databaseResponse = await axios.get(
      `https://api.notion.com/v1/databases/${notionDatabaseId}`,
      {
        headers: buildNotionHeaders(notionApiKey),
      }
    );

    const dealStageProperty = toNotionValue(
      "Deal Stage",
      databaseResponse.data.properties["Deal Stage"],
      dealStage
    );

    await axios.patch(
      `https://api.notion.com/v1/pages/${normalizeNotionPageId(notionPageId)}`,
      {
        properties: {
          "Deal Stage": dealStageProperty,
        },
      },
      {
        headers: buildNotionHeaders(notionApiKey),
      }
    );

    callback({
      outputFields: {
        updatedNotionPageId: normalizeNotionPageId(notionPageId),
        updatedDealStage: dealStage,
      },
    });
  } catch (error) {
    console.error("Failed to update Notion page:", getErrorDetails(error));
    throw error;
  }
};

function getInputField(event, possibleNames) {
  const inputFields = event.inputFields || {};

  for (const name of possibleNames) {
    if (
      inputFields[name] !== undefined &&
      inputFields[name] !== null &&
      inputFields[name] !== ""
    ) {
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
      `The Notion database is missing the "${propertyName}" property. Check the field name in Notion.`
    );
  }

  switch (propertySchema.type) {
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
      return {
        rich_text: [
          {
            text: {
              content: String(value),
            },
          },
        ],
      };
    default:
      throw new Error(
        `Unsupported Notion property type "${propertySchema.type}" for "${propertyName}".`
      );
  }
}

function formatDealStage(dealStage) {
  const knownHubSpotStages = {
    appointmentscheduled: "Appointment Scheduled",
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

  if (propertyName === "Deal Stage") {
    return readableValue;
  }

  const normalizedValue = normalizeOptionName(readableValue);
  const matchingOption = options.find(
    (option) => normalizeOptionName(option.name) === normalizedValue
  );

  return matchingOption ? matchingOption.name : readableValue;
}

function normalizeNotionDatabaseId(databaseIdOrUrl) {
  const match = String(databaseIdOrUrl || "").match(/[0-9a-fA-F]{32}/);

  if (!match) {
    return databaseIdOrUrl;
  }

  const id = match[0];

  return [
    id.slice(0, 8),
    id.slice(8, 12),
    id.slice(12, 16),
    id.slice(16, 20),
    id.slice(20),
  ].join("-");
}

function normalizeNotionPageId(pageIdOrUrl) {
  const match = String(pageIdOrUrl || "").match(/[0-9a-fA-F]{32}/);

  if (!match) {
    return pageIdOrUrl;
  }

  const id = match[0];

  return [
    id.slice(0, 8),
    id.slice(8, 12),
    id.slice(12, 16),
    id.slice(16, 20),
    id.slice(20),
  ].join("-");
}

function normalizeOptionName(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]/g, "");
}

function titleize(value) {
  return String(value)
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .trim()
    .replace(/\w\S*/g, (word) => {
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    });
}

function getErrorDetails(error) {
  if (error.response) {
    return {
      status: error.response.status,
      data: error.response.data,
    };
  }

  return error.message;
}
