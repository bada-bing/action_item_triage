// Check a collector's output against the contract. Both ends run this: the
// collector before it announces a run, the server before it accepts one.

import { SlackRun } from "./slack.ts";

const path = process.argv[2];
if (!path) {
  console.error("usage: validate <run.json>");
  process.exit(2);
}

const result = SlackRun.safeParse(await Bun.file(path).json());
if (!result.success) {
  for (const issue of result.error.issues) {
    console.error(`${issue.path.join(".") || "(root)"}: ${issue.message}`);
  }
  process.exit(1);
}
console.log(`${path}  ok  items=${result.data.items.length}`);
