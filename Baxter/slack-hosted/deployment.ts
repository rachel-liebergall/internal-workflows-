// Copy deployment.example.json to deployment.local.json before checking or deploying.
// Keep real identifiers in the ignored local file; secrets belong in hosted variables.
import config from "./deployment.local.json" with { type: "json" };
export const deployment = config;
