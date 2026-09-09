// An errand leaves the sitting: it needs real work or waiting on the world,
// so it is written down where errands live and the card is finished.

import { appendFile } from "node:fs/promises";
import type { SlackItem } from "@ait/contract/slack";
import { plainText } from "@ait/contract/slack-markup";

const ERRANDS_FILE =
  process.env.ERRANDS_FILE ??
  "/Users/miki/Developer/src/action_item_triage/errands.md";

/** As much of the message as reads as a line of its own. */
const WIDTH = 110;

function summarise(text: string): string {
  const line = text.replace(/\s+/g, " ").trim();
  if (line.length <= WIDTH) return line;
  const cut = line.slice(0, WIDTH);
  return `${cut.slice(0, cut.lastIndexOf(" "))}…`;
}

export async function createErrand(item: SlackItem): Promise<void> {
  const message = item.content.message;
  const conversation = item.context.location.conversation;
  const where =
    conversation.kind === "channel" ? `#${conversation.name}` : conversation.name;

  const line = `- LATER [${message.author.display} in ${where}](${item.meta.ref}) — ${summarise(plainText(message.text))}\n`;
  await appendFile(ERRANDS_FILE, line);
}
