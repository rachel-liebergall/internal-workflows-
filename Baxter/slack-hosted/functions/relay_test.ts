import { deployment } from "../deployment.ts";
import { forward } from "./relay.ts";

const inputs = {
  channel: deployment.pilotChannelId,
  user: deployment.pilotUserId,
  text: "Pilot reflection",
  message_ts: "1791745000.000001",
};
const env = {
  PILOT_ENABLED: "true",
  OPENAI_API_KEY: "synthetic-key",
  OPENAI_SESSION_ID: "sess_test",
};
function assert(value: unknown) {
  if (!value) throw new Error("Assertion failed");
}

Deno.test("Other people and conversations cannot reach OpenAI", async () => {
  let calls = 0;
  const mock: typeof fetch = () => {
    calls++;
    return Promise.resolve(new Response(null, { status: 202 }));
  };
  await forward(
    { ...inputs, user: deployment.botUserId },
    env,
    deployment.teamId,
    mock,
  );
  await forward(
    { ...inputs, channel: "D_OTHER" },
    env,
    deployment.teamId,
    mock,
  );
  await forward(inputs, env, "T_OTHER", mock);
  await forward(
    inputs,
    { ...env, PILOT_ENABLED: "false" },
    deployment.teamId,
    mock,
  );
  assert(calls === 0);
});
Deno.test("Missing credential and malformed session fail without a network request", async () => {
  const mock: typeof fetch = () => {
    throw new Error("Unexpected network call");
  };
  assert(
    "error" in
      await forward(
        inputs,
        { ...env, OPENAI_API_KEY: "" },
        deployment.teamId,
        mock,
      ),
  );
  assert(
    "error" in
      await forward(
        inputs,
        { ...env, OPENAI_SESSION_ID: "../other" },
        deployment.teamId,
        mock,
      ),
  );
});
Deno.test("Accepted messages carry stable idempotency, project and participant content", async () => {
  const keys: string[] = [];
  const mock: typeof fetch = (_url, options) => {
    const headers = new Headers(options?.headers);
    keys.push(headers.get("Idempotency-Key")!);
    assert(headers.get("OpenAI-Project") === deployment.openaiProjectId);
    const body = JSON.parse(String(options?.body));
    assert(body.events[0].type === "agent.session.input.message");
    assert(body.events[0].input[0].content[0].text.includes(inputs.text));
    return Promise.resolve(new Response(null, { status: 202 }));
  };
  assert("outputs" in await forward(inputs, env, deployment.teamId, mock));
  assert("outputs" in await forward(inputs, env, deployment.teamId, mock));
  assert(keys.length === 2 && keys[0] === keys[1]);
});
Deno.test("HTTP rejection cannot be reported as a successful handoff", async () => {
  const mock: typeof fetch = () =>
    Promise.resolve(new Response(null, { status: 401 }));
  const result = await forward(inputs, env, deployment.teamId, mock);
  assert("error" in result && result.error?.includes("401"));
});
