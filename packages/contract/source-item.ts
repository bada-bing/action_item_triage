// The slots every collector fills, whatever the source.
//
// A source item is one thing a source put in front of me: a Slack
// notification, a mail, a bullet in a note. The slots are fixed and what sits
// inside them is the source's own — so a card always knows where to look, and
// a new collector adds no fields, only fills these differently.

import { z } from "zod";

/** Something that can be done about an item. Same shape offered or chosen: a
 *  proposal is one I could take, a disposition is the one I took. */
export const Action = z.object({
  /** Which actions exist is not settled, so the name is not constrained. */
  name: z.string(),
  /** What the card cannot supply: policy, a choice, content. Not the channel
   *  or the thread, which an executor reads off the card. */
  args: z.record(z.string(), z.unknown()).default({}),
  /** Whether completing it resolves the card, or hands it back to me. */
  resolves: z.boolean(),
});
export type Action = z.infer<typeof Action>;

export interface SourceItem {
  /** Identity within a run, so several notifications can fold into one item.
   *  Nothing persists between sittings, so it need not survive one. */
  id: string;

  /** What the item is, in the source's own vocabulary.
   *  Slack: `message` · mail: `subject`, `body` · Logseq: `text` */
  content: Record<string, unknown>;

  /** Everything around it: where it sits, why it is here, what surrounds it. */
  context: Record<string, unknown>;

  /** Ambient facts about the item: where to open it, and whatever else the
   *  source keeps about it rather than in it.
   *  Slack: `ref` · mail: `ref`, `message_id` · Logseq: `ref`, `file` */
  meta: Record<string, unknown>;

  /** What could be done about it, offered by whoever knows the source. */
  proposals: Action[];
}
