import { deployment } from "../deployment.ts";
// Synthetic checks are isolated from production weeks and never message other teammates.
import {
  type Client,
  get,
  participantKey,
  put,
  RACHEL,
  type RecordData,
  REPORTS,
  scheduleOnce,
  slack,
  TEAM,
  thread,
} from "./common.ts";
import { dispatch, finish, report } from "./cycle.ts";
import { teamReply } from "../functions/team_reply.ts";
import { notion, reportBlock, rich } from "./notion.ts";
export const VALIDATION_WEEK = "2099-01-05";
export async function validateRuntime(
  client: Client,
  env: Record<string, string>,
  op: string,
) {
  const key = `week:${VALIDATION_WEEK}`;
  if (op === "verify_runtime") {
    if (await get(client, key)) {
      throw new Error("Validation already exists; inspect before rerunning");
    }
    const auth = await slack(client, "auth.test");
    if (auth.user_id !== deployment.botUserId || auth.team_id !== TEAM) {
      throw new Error("Unexpected Baxter identity");
    }
    const page = await notion(env, "pages", "POST", {
      parent: { type: "data_source_id", data_source_id: REPORTS },
      properties: {
        Name: { title: rich("Baxter runtime test — synthetic, temporary") },
      },
    });
    const block = await reportBlock(env, page.id);
    const channel =
      (await slack(client, "conversations.open", { users: RACHEL })).channel.id;
    const sent = await slack(client, "chat.postMessage", {
      channel,
      text:
        "Baxter connection check: this thread is a temporary automated test of the team reflection setup. No response is needed. Synthetic examples will be used and the test report will be archived.",
    });
    await put(client, key, {
      week: VALIDATION_WEEK,
      validation: true,
      roster: [{ id: RACHEL, name: "Synthetic participant", first: "Test" }],
      bot: auth.user_id,
      page: page.id,
      block,
      cutoff: new Date(Date.now() + 30 * 60000).toISOString(),
      report_status: "collecting",
      validation_phase: "first_reply",
    });
    await put(client, participantKey(VALIDATION_WEEK, RACHEL), {
      week: VALIDATION_WEEK,
      user: RACHEL,
      name: "Synthetic participant",
      first: "Test",
      bot: auth.user_id,
      channel,
      root: sent.ts,
      status: "sent",
    });
    await dispatch(client, env, VALIDATION_WEEK, RACHEL);
    const ts = syntheticTs(sent.ts, 1);
    await teamReply(client, { ...env, TEAM_ENABLED: "true" }, TEAM, {
      week: VALIDATION_WEEK,
      user: RACHEL,
      channel,
      text:
        "Synthetic test reflection: deck revisions took most of my week because the audience kept changing. The kickoff moved quickly when we agreed on a decision owner. Next week I would agree on the audience before drafting.",
      message_ts: ts,
      thread_ts: sent.ts,
    });
    await scheduleOnce(client, "verify_runtime_reply", VALIDATION_WEEK, "", 60);
    console.log(
      JSON.stringify({
        validation: "started",
        thread: sent.ts,
        listener_created: true,
      }),
    );
    return;
  }
  const cycle = await get(client, key);
  if (!cycle?.validation) throw new Error("Missing isolated validation state");
  const p = (await get(client, participantKey(VALIDATION_WEEK, RACHEL)))!;
  if (op === "verify_runtime_reply") {
    const messages = await thread(client, p, cycle.cutoff);
    const expected = syntheticTs(
      p.root,
      cycle.validation_phase === "first_reply" ? 1 : 2,
    );
    const answered = messages.some((m: RecordData) =>
      m.author === "baxter" && m.metadata?.event_payload?.source_ts === expected
    );
    // thread() normalizes message text and author, but metadata is deliberately absent; inspect the raw thread for the reconciliation marker.
    const raw = await slack(client, "conversations.replies", {
      channel: p.channel,
      ts: p.root,
      include_all_metadata: true,
      limit: 100,
    });
    const exact = answered ||
      raw.messages.some((m: RecordData) =>
        m.user === p.bot && m.thread_ts === p.root &&
        m.metadata?.event_payload?.source_ts === expected
      );
    if (!exact) {
      cycle.validation_checks = (cycle.validation_checks || 0) + 1;
      await put(client, key, cycle);
      if (cycle.validation_checks >= 6) {
        throw new Error(
          "Runtime test has not received the expected Baxter reply; inspect the agent",
        );
      }
      await scheduleOnce(
        client,
        "verify_runtime_reply",
        VALIDATION_WEEK,
        "",
        60,
      );
      return;
    }
    if (cycle.validation_phase === "first_reply") {
      cycle.first_session = p.session;
      cycle.validation_phase = "resumed_reply";
      cycle.validation_checks = 0;
      p.last_forward_at = Date.now() - 60 * 60000;
      await put(client, participantKey(VALIDATION_WEEK, RACHEL), p);
      await put(client, key, cycle);
      await teamReply(client, { ...env, TEAM_ENABLED: "true" }, TEAM, {
        week: VALIDATION_WEEK,
        user: RACHEL,
        channel: p.channel,
        text:
          "Synthetic continuation after a long pause: we could agree on the audience in a ten-minute kickoff and use that agreement to review drafts. Please include this in my next-week experiment.",
        message_ts: syntheticTs(p.root, 2),
        thread_ts: p.root,
      });
      const resumed = await get(
        client,
        participantKey(VALIDATION_WEEK, RACHEL),
      );
      if (resumed?.session === cycle.first_session) {
        throw new Error("Resume did not isolate a replacement session");
      }
      await scheduleOnce(
        client,
        "verify_runtime_reply",
        VALIDATION_WEEK,
        "",
        60,
      );
      return;
    }
    cycle.validation_phase = "reporting";
    const id = `validation-message:${VALIDATION_WEEK}`;
    await put(client, id, {
      author: "participant",
      ts: syntheticTs(p.root, 1),
      text:
        "SYNTHETIC TEST DATA: deck revisions took most of my week because the audience changed. Kickoff gained momentum after agreeing a decision owner. Next week agree on the audience before drafting. This is an individual signal, not a shared pattern.",
    });
    p.captured = true;
    p.message_ids = [id];
    p.collection_error = null;
    await put(client, participantKey(VALIDATION_WEEK, RACHEL), p);
    await put(client, key, cycle);
    await report(client, env, VALIDATION_WEEK);
    console.log(
      JSON.stringify({
        validation: "conversation_and_resume_passed",
        report: "submitted",
      }),
    );
  } else if (op === "finish") {
    await finish(client, env, VALIDATION_WEEK);
    const done = await get(client, key);
    if (done?.report_status === "completed") {
      await notion(env, `pages/${done.page}`, "PATCH", { archived: true });
      if (p.trigger) {
        await slack(client, "workflows.triggers.delete", {
          trigger_id: p.trigger,
        });
      }
      await put(client, "runtime_validation", {
        passed: true,
        completed_at: new Date().toISOString(),
        conversation: true,
        resume: true,
        listener: true,
        agent_report: true,
        notion_report: true,
      });
      console.log(
        JSON.stringify({
          runtime_validation: "passed",
          temporary_report: "archived",
          temporary_listener: "removed",
        }),
      );
    }
  }
}
function syntheticTs(root: string, increment: number) {
  const [seconds, fraction] = root.split(".");
  return `${seconds}.${String(Number(fraction) + increment).padStart(6, "0")}`;
}
