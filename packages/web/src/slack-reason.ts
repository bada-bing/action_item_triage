// Why an item is on the board. A hue means somebody mentioned me, a fill means
// they meant me in particular, and what is no mention at all takes neither.

import type { Reason } from "@ait/contract/slack";

type Tone = "direct" | "dm" | "group" | "broadcast" | "quiet";

const CHIP: Record<Reason["reason"], { label: string; tone: Tone }> = {
  "mention.direct": { label: "direct mention", tone: "direct" },
  dm: { label: "dm", tone: "dm" },
  "mention.group": { label: "group mention", tone: "group" },
  "mention.broadcast": { label: "broadcast mention", tone: "broadcast" },
  reaction: { label: "reaction", tone: "quiet" },
  "reply.thread": { label: "thread reply", tone: "quiet" },
  invitation: { label: "invitation", tone: "quiet" },
  reminder: { label: "reminder", tone: "quiet" },
};

/** Names a reason and says how firmly it addresses me.
 *  `"mention.direct"` -> `{label: "direct mention", tone: "direct"}` */
export function chipOf(reason: Reason["reason"]): { label: string; tone: Tone } {
  return CHIP[reason];
}
