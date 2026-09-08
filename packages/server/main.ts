// Serves a collector's run to the page. The collector writes a file and the
// server reads it; nothing calls a collector and nothing waits for one.

import { CardDecision } from "@ait/contract/action-card";
import { SlackRun } from "@ait/contract/slack";
import { build, decide } from "./board.ts";

/** Which run to serve. Absolute, since runs do not live in this repository. */
const RUN_FILE = process.env.RUN_FILE ??
  `${process.env.HOME}/Developer/src/action_item_triage/collectors/slack/out/current.json`;
const PORT = Number(process.env.PORT ?? 3000);

async function readRun() {
  const file = Bun.file(RUN_FILE);
  if (!(await file.exists())) return { error: `no run at ${RUN_FILE}` };

  const parsed = SlackRun.safeParse(await file.json());
  // Serving a run that does not match the contract moves a collector bug into
  // the page.
  if (!parsed.success) {
    return {
      error: `${RUN_FILE} does not match the contract`,
      issues: parsed.error.issues.map(
        (i) => `${i.path.join(".") || "(root)"}: ${i.message}`,
      ),
    };
  }
  return parsed.data;
}

/** The run's own fields, with cards in place of the items it read. */
async function board() {
  const parsed = await readRun();
  if ("error" in parsed) return parsed;
  const { items, ...rest } = parsed;
  return { ...rest, cards: build(parsed) };
}

async function respond() {
  const body = await board();
  return Response.json(body, { status: "error" in body ? 502 : 200 });
}

const server = Bun.serve({
  port: PORT,
  routes: {
    "/api/board": respond,
    "/api/decision": {
      POST: async (request: Request) => {
        const decision = CardDecision.safeParse(await request.json());
        if (!decision.success) {
          return Response.json({ error: "not a decision" }, { status: 400 });
        }
        decide(decision.data.id, decision.data.state);
        return respond();
      },
    },
  },
  fetch: () => new Response("not found", { status: 404 }),
});

console.log(`listening on ${server.url}  reading ${RUN_FILE}`);
