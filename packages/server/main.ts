// Serves a collector's run to the page. The collector writes a file and the
// server reads it; nothing calls a collector and nothing waits for one.

import { z } from "zod";
import { SlackRun } from "@ait/contract/slack";
import { Action } from "@ait/contract/source-item";
import { openBoard } from "./board.ts";

/** Which card, and the action I chose. It travels whole, so an argument I
 *  supplied arrives with it. */
const Body = z.object({ card_id: z.string(), action: Action });

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
const board = openBoard(run);

/** The run's own fields, which never change; the cards go beside them. */
const { items, ...runFields } = run;

function respond() {
  return Response.json({ ...runFields, cards: board.cards });
}

const server = Bun.serve({
  port: PORT,
  routes: {
    "/api/board": () => respond(),
    "/api/decision": {
      POST: async (request: Request) => {
        const decision = Body.safeParse(await request.json());
        if (!decision.success) {
          return Response.json({ error: "not a decision" }, { status: 400 });
        }
        const taken = await board.decide(
          decision.data.card_id,
          decision.data.action,
        );
        if (!taken) {
          return Response.json({ error: "no such card" }, { status: 404 });
        }
        return respond();
      },
    },
  },
  fetch: () => new Response("not found", { status: 404 }),
});

console.log(`listening on ${server.url}  ${run.items.length} items from ${RUN_FILE}`);
