const axios = require("axios");

const NOTION_API_VERSION = "2022-06-28";

// HubSpot runs this function when the Custom code workflow action executes.
exports.main = async (event, callback) => {
  try {
    const notionApiKey = process.env.NOTION_API_KEY;
    const notionDatabaseId = normalizeNotionDatabaseId(process.env.NOTION_DATABASE_ID);
    const hubSpotPrivateAppToken = process.env.HUBSPOT_PRIVATE_APP_TOKEN;
    const notionUserIdsByOwnerName = parseNotionUserMapping(
      process.env.NOTION_USER_IDS_BY_OWNER_NAME
    );

    if (!notionApiKey || !notionDatabaseId || !hubSpotPrivateAppToken) {
      throw new Error(
        "Missing HubSpot secrets. Add NOTION_API_KEY, NOTION_DATABASE_ID, and HUBSPOT_PRIVATE_APP_TOKEN to the custom code action."
      );
    }

    // Contact and company are fetched from the deal association instead of
    // relying on brittle "most recently updated contact" workflow inputs.
    const associatedRecords = await fetchAssociatedContactAndCompany(
      event.object.objectId,
      hubSpotPrivateAppToken
    );

    const opportunity = {
      _receivedInputFields: event.inputFields || {},
      opportunityName: getInputField(event, ["deal_name", "dealname"]),
      companyName: associatedRecords.companyName,
      contactName: associatedRecords.contactName,
      dealStage: formatDealStage(getInputField(event, ["deal_stage", "dealstage"])),
      meetingDate: getInputField(event, [
        "meeting_date",
        "initial_meeting_date",
        "first_meeting_date",
        "firstmeetingdate",
      ]),
      serviceType: formatServiceType(getInputField(event, ["service_type", "service"])),
      opportunityOwners: formatOpportunityOwners(
        getInputField(event, [
          "opportunity_owners",
          "opportunity_owner",
          "contact_owners",
          "contact_owner",
        ])
      ),
      description: getInputField(event, ["deal_description", "description"]),
      hubSpotUrl: buildHubSpotRecordUrl(event),
    };

    validateOpportunity(opportunity);

    const databaseResponse = await axios.get(
      `https://api.notion.com/v1/databases/${notionDatabaseId}`,
      {
        headers: buildNotionHeaders(notionApiKey),
      }
    );

    const notionProperties = buildNotionProperties(
      databaseResponse.data.properties,
      opportunity,
      notionUserIdsByOwnerName
    );

    const notionResponse = await axios.post(
      "https://api.notion.com/v1/pages",
      {
        parent: {
          database_id: notionDatabaseId,
        },
        properties: notionProperties,
      },
      {
        headers: buildNotionHeaders(notionApiKey),
      }
    );

    const notionPageUrl = notionResponse.data.url;

    // Define matching Data outputs in HubSpot so later workflow steps can use them.
    callback({
      outputFields: {
        notionPageUrl,
        notionPageId: notionResponse.data.id,
      },
    });
  } catch (error) {
    console.error("Failed to create Notion page:", getErrorDetails(error));

    // Throwing the error marks the HubSpot action as failed.
    // HubSpot can retry some temporary axios errors, such as 429 and 5XX responses.
    throw error;
  }
};

function validateOpportunity(opportunity) {
  const requiredFields = {
    opportunityName: "deal_name",
    companyName: "associated company name",
    dealStage: "deal_stage",
    meetingDate: "meeting_date",
    hubSpotUrl: "HubSpot enrolled record ID",
  };

  const missingFields = Object.entries(requiredFields)
    .filter(([key]) => !opportunity[key])
    .map(([, hubspotInputName]) => hubspotInputName);

  if (missingFields.length > 0) {
    const receivedFields = Object.keys(opportunity._receivedInputFields || {});
    throw new Error(
      `Missing required HubSpot input field(s): ${missingFields.join(
        ", "
      )}. HubSpot sent these input field keys: ${receivedFields.join(", ")}`
    );
  }

  if (Number.isNaN(parseHubSpotDate(opportunity.meetingDate).getTime())) {
    throw new Error("meeting_date must be a valid date or ISO date-time value.");
  }
}

async function fetchAssociatedContactAndCompany(dealId, hubSpotPrivateAppToken) {
  if (!dealId) {
    throw new Error("Missing HubSpot deal record ID.");
  }

  const headers = buildHubSpotHeaders(hubSpotPrivateAppToken);
  const contactId = await fetchAssociatedObjectId(dealId, "contacts", headers);
  const companyId = await fetchAssociatedObjectId(dealId, "companies", headers);

  const [contact, company] = await Promise.all([
    fetchHubSpotObject("contacts", contactId, ["firstname", "lastname", "email"], headers),
    fetchHubSpotObject("companies", companyId, ["name"], headers),
  ]);

  return {
    contactName:
      buildContactName(contact.properties.firstname, contact.properties.lastname) ||
      contact.properties.email ||
      "",
    companyName: company.properties.name,
  };
}

async function fetchAssociatedObjectId(dealId, objectType, headers) {
  const response = await axios.get(
    `https://api.hubapi.com/crm/v4/objects/deals/${dealId}/associations/${objectType}`,
    { headers }
  );

  const associations = response.data.results || [];

  if (associations.length === 0) {
    throw new Error(`The deal does not have an associated ${objectType} record.`);
  }

  return findPrimaryOrFirstAssociationId(associations);
}

function findPrimaryOrFirstAssociationId(associations) {
  const primaryAssociation = associations.find((association) => {
    return (association.associationTypes || []).some((type) => {
      return normalizeOptionName(type.label || "") === "primary";
    });
  });

  return (primaryAssociation || associations[0]).toObjectId;
}

async function fetchHubSpotObject(objectType, objectId, properties, headers) {
  const response = await axios.get(
    `https://api.hubapi.com/crm/v3/objects/${objectType}/${objectId}`,
    {
      headers,
      params: {
        properties: properties.join(","),
      },
    }
  );

  return response.data;
}

function buildHubSpotHeaders(hubSpotPrivateAppToken) {
  return {
    Authorization: `Bearer ${hubSpotPrivateAppToken}`,
    "Content-Type": "application/json",
  };
}

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

function buildNotionProperties(
  databaseProperties,
  opportunity,
  notionUserIdsByOwnerName
) {
  const properties = {
    Opportunity: toNotionValue(
      "Opportunity",
      databaseProperties.Opportunity,
      opportunity.opportunityName
    ),
    Company: toNotionValue("Company", databaseProperties.Company, opportunity.companyName),
    "Contact Name": toNotionValue(
      "Contact Name",
      databaseProperties["Contact Name"],
      opportunity.contactName
    ),
    "Deal Stage": toNotionValue(
      "Deal Stage",
      databaseProperties["Deal Stage"],
      opportunity.dealStage
    ),
    "Meeting Date": toNotionValue(
      "Meeting Date",
      databaseProperties["Meeting Date"],
      formatDateForNotion(opportunity.meetingDate)
    ),
    "Service Type": toNotionValue(
      "Service Type",
      databaseProperties["Service Type"],
      opportunity.serviceType
    ),
    "Opportunity Owner": toNotionValue(
      "Opportunity Owner",
      databaseProperties["Opportunity Owner"],
      opportunity.opportunityOwners,
      notionUserIdsByOwnerName
    ),
    "HubSpot URL": toNotionValue(
      "HubSpot URL",
      databaseProperties["HubSpot URL"],
      opportunity.hubSpotUrl
    ),
  };

  if (opportunity.description && databaseProperties["Deal Description"]) {
    properties["Deal Description"] = toNotionValue(
      "Deal Description",
      databaseProperties["Deal Description"],
      opportunity.description
    );
  }

  return properties;
}

function toNotionValue(
  propertyName,
  propertySchema,
  value,
  notionUserIdsByOwnerName = {}
) {
  if (!propertySchema) {
    throw new Error(
      `The Notion database is missing the "${propertyName}" property. Check the field name in Notion.`
    );
  }

  switch (propertySchema.type) {
    case "title":
      return {
        title: [
          {
            text: {
              content: String(value),
            },
          },
        ],
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
    case "select":
      return {
        select: {
          name: getMatchingOptionName(propertySchema.select.options, value, propertyName),
        },
      };
    case "multi_select":
      return {
        multi_select: toArray(value).map((item) => ({
          name: getMatchingOptionName(
            propertySchema.multi_select.options,
            item,
            propertyName
          ),
        })),
      };
    case "people":
      return {
        people: toArray(value).map((personName) => {
          const notionUserId = notionUserIdsByOwnerName[normalizeOptionName(personName)];

          if (!notionUserId) {
            throw new Error(
              `Missing Notion user ID mapping for "${personName}". Add it to the NOTION_USER_IDS_BY_OWNER_NAME secret.`
            );
          }

          return {
            id: notionUserId,
          };
        }),
      };
    case "status":
      return {
        status: {
          name: getMatchingOptionName(propertySchema.status.options, value, propertyName),
        },
      };
    case "date":
      return {
        date: {
          start: String(value),
        },
      };
    case "url":
      return {
        url: String(value),
      };
    default:
      throw new Error(
        `Unsupported Notion property type "${propertySchema.type}" for "${propertyName}".`
      );
  }
}

function buildContactName(firstName, lastName) {
  // HubSpot often stores contact names as separate first and last name properties.
  // This combines whichever parts are available into one Notion field.
  return [firstName, lastName].filter(Boolean).join(" ").trim();
}

function formatDealStage(dealStage) {
  // HubSpot often sends the internal value, such as "appointmentscheduled",
  // while Notion usually wants a readable select option, such as "Appointment Scheduled".
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

function formatServiceType(serviceType) {
  // This maps HubSpot values into the four Notion classifications you want.
  // If HubSpot sends a blank value, the deal is classified as General.
  const knownServiceTypes = {
    room: "The Room",
    theroom: "The Room",
    signal: "The Signal",
    thesignal: "The Signal",
    build: "The Build",
    thebuild: "The Build",
    general: "General",
  };

  const rawValue = String(serviceType || "General");
  const normalizedValue = normalizeOptionName(rawValue);

  return knownServiceTypes[normalizedValue] || "General";
}

function formatOpportunityOwners(opportunityOwners) {
  // HubSpot dropdowns usually send one string. Multiple checkbox values can
  // arrive as semicolon-separated text, so this supports both shapes.
  return toArray(opportunityOwners).map((owner) => titleize(owner));
}

function parseNotionUserMapping(rawMapping) {
  // Secret format:
  // {"Rachel":"notion-user-id","Jason":"notion-user-id","Jess":"notion-user-id"}
  if (!rawMapping) {
    return {};
  }

  const parsedMapping = JSON.parse(rawMapping);

  return Object.fromEntries(
    Object.entries(parsedMapping).map(([name, notionUserId]) => {
      return [normalizeOptionName(name), notionUserId];
    })
  );
}

function getMatchingOptionName(options, value, propertyName) {
  const readableValue = String(value);

  // Deal Stage should display the cleaned-up label, even if Notion already has
  // an older option named like HubSpot's internal value: "appointmentscheduled".
  if (propertyName === "Deal Stage") {
    return readableValue;
  }

  const normalizedValue = normalizeOptionName(readableValue);
  const matchingOption = options.find(
    (option) => normalizeOptionName(option.name) === normalizedValue
  );

  return matchingOption ? matchingOption.name : readableValue;
}

function toArray(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  return String(value || "")
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean);
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

function normalizeNotionDatabaseId(databaseIdOrUrl) {
  // If someone pasted the full Notion database URL, pull out just the 32-character ID.
  // Notion's API wants a UUID, not the URL query string after ?v=...
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

function buildHubSpotRecordUrl(event) {
  // HubSpot gives custom code actions the enrolled record's portal, type, and ID.
  // That means you do not need to select a separate "URL" property in HubSpot.
  const portalId = event.origin && event.origin.portalId;
  const objectType = event.object && event.object.objectType;
  const objectId = event.object && event.object.objectId;

  const objectTypeIds = {
    CONTACT: "0-1",
    COMPANY: "0-2",
    DEAL: "0-3",
  };

  const objectTypeId = objectTypeIds[objectType];

  if (!portalId || !objectId || !objectTypeId) {
    throw new Error(
      `Could not build HubSpot record URL for object type "${objectType}".`
    );
  }

  return `https://app.hubspot.com/contacts/${portalId}/record/${objectTypeId}/${objectId}`;
}

function formatDateForNotion(dateValue) {
  // Send a date-only value so Notion does not shift the date across time zones.
  if (typeof dateValue === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    return dateValue;
  }

  const date = parseHubSpotDate(dateValue);

  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

function parseHubSpotDate(dateValue) {
  // HubSpot date picker values can arrive as millisecond timestamps, sometimes
  // as strings like "1770854400000". JavaScript needs those converted to numbers.
  if (typeof dateValue === "number") {
    return new Date(dateValue);
  }

  if (typeof dateValue === "string" && /^\d+$/.test(dateValue)) {
    return new Date(Number(dateValue));
  }

  return new Date(dateValue);
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
