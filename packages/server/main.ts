// Serves a collector's run to the page. The collector writes a file and the
// server reads it; nothing calls a collector and nothing waits for one.

import { CardDecision } from "@ait/contract/action-card";
import { SlackRun } from "@ait/contract/slack";
import { build, decide } from "./board.ts";

/** Which run to serve. Absolute, since runs do not live in this repository. */
const RUN_FILE = process.env.RUN_FILE ??
  `${process.env.HOME}/Developer/src/action_item_triage/collectors/slack/out/current.json`;
const PORT = Number(process.env.PORT ?? 3000);

/** Read once, since a different run means a restart anyway. */
async function load(): Promise<SlackRun> {
  const file = Bun.file(RUN_FILE);
  if (!(await file.exists())) {
    console.error(`no run at ${RUN_FILE}`);
    process.exit(1);
  }
  const parsed = SlackRun.safeParse(await file.json());
  if (!parsed.success) {
    console.error(`${RUN_FILE} does not match the contract:`);
    for (const issue of parsed.error.issues) {
      console.error(`  ${issue.path.join(".") || "(root)"}: ${issue.message}`);
    }
    process.exit(1);
  }
  return parsed.data;
}

const run = await load();

/** The run's own fields, with cards in place of the items it read. */
function respond() {
  const { items, ...rest } = run;
  return Response.json({ ...rest, cards: build(run) });
}

const server = Bun.serve({
  port: PORT,
  routes: {
    "/api/board": () => respond(),
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

console.log(`listening on ${server.url}  ${run.items.length} items from ${RUN_FILE}`);
