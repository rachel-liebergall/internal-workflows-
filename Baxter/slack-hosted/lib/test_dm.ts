import { deployment } from "../deployment.ts";
import {
  type Client,
  get,
  participantKey,
  put,
  RACHEL,
  scheduleOnce,
  slack,
  TEAM,
} from "./common.ts";
import { teamReply } from "../functions/team_reply.ts";
import { dispatch } from "./cycle.ts";
const TEST_WEEK = "2099-01-12";
export async function testDm(
  client: Client,
  env: Record<string, string>,
  op: string,
) {
  if (op === "recover_test_dm") {
    const p = await get(client, participantKey(TEST_WEEK, RACHEL));
    if (!p?.test || !p.root) throw new Error("Missing Rachel test");
    const history = await slack(client, "conversations.history", {
      channel: p.channel,
      oldest: "1791749972.089898",
      latest: "1791749972.089900",
      inclusive: true,
      limit: 10,
    });
    const m = history.messages.find((
      m: { ts: string; user: string; thread_ts?: string },
    ) => m.ts === "1791749972.089899" && m.user === RACHEL && !m.thread_ts);
    if (!m) throw new Error("Original test reply not found");
    await teamReply(client, env, TEAM, {
      week: TEST_WEEK,
      user: RACHEL,
      channel: p.channel,
      text: m.text,
      message_ts: m.ts,
      thread_ts: p.root,
      main_dm: true,
    });
    console.log(
      JSON.stringify({ test_reply_recovered: m.ts, main_dm_listener: "ready" }),
    );
    return;
  }
  if (op === "close_test_dm") {
    const p = await get(client, participantKey(TEST_WEEK, RACHEL));
    if (p?.test && p.dm_trigger) {
      await slack(client, "workflows.triggers.delete", {
        trigger_id: p.dm_trigger,
      });
      p.dm_trigger = null;
      await put(client, participantKey(TEST_WEEK, RACHEL), p);
    }
    if (p?.test && p.trigger) {
      await slack(client, "workflows.triggers.delete", {
        trigger_id: p.trigger,
      });
      p.trigger = null;
      p.test_closed = true;
      await put(client, participantKey(TEST_WEEK, RACHEL), p);
    }
    return;
  }
  if (env.TEAM_ENABLED !== "true") {
    throw new Error("Team routing is not enabled");
  }
  const auth = await slack(client, "auth.test");
  if (auth.user_id !== deployment.botUserId || auth.team_id !== TEAM) {
    throw new Error("Unexpected Baxter identity");
  }
  if (await get(client, `week:${TEST_WEEK}`)) {
    throw new Error(
      "This test already exists; use its recorded thread instead of sending a duplicate",
    );
  }
  const channel =
    (await slack(client, "conversations.open", { users: RACHEL })).channel.id;
  const cutoff = new Date(Date.now() + 24 * 60 * 60000).toISOString();
  await put(client, `week:${TEST_WEEK}`, {
    week: TEST_WEEK,
    test: true,
    roster: [{ id: RACHEL, name: "Rachel Liebergall", first: "Rachel" }],
    bot: auth.user_id,
    cutoff,
    report_status: "test_only",
  });
  const sent = await slack(client, "chat.postMessage", {
    channel,
    text:
      "Hi Rachel 👋 This is your Baxter reflection test. Reply in this thread and we’ll talk it through, using the same live conversation path the team will use. This test is separate from the weekly report.\n\n1. What took most of your time this week? Was it worth it?\n2. Where did you feel real momentum — something that moved faster or better than expected?\n3. Where did you feel stuck, spinning, or going in circles?\n4. What pattern are you noticing — in your work, a client situation, or the team?\n5. One thing you’d do differently next week.\n\nStart with whichever question feels most useful. The test thread stays open for 24 hours.",
  });
  await put(client, participantKey(TEST_WEEK, RACHEL), {
    week: TEST_WEEK,
    user: RACHEL,
    name: "Rachel Liebergall",
    first: "Rachel",
    bot: auth.user_id,
    channel,
    root: sent.ts,
    status: "sent",
    test: true,
  });
  await dispatch(client, env, TEST_WEEK, RACHEL);
  await scheduleOnce(client, "close_test_dm", TEST_WEEK, "", 24 * 60 * 60);
  console.log(
    JSON.stringify({
      test_dm: "ready",
      channel,
      thread: sent.ts,
      excluded_from_weekly_report: true,
      cutoff,
    }),
  );
}
