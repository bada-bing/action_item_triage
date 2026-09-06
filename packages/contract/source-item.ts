// The slots every collector fills, whatever the source.
//
// A source item is one thing a source put in front of me: a Slack
// notification, a mail, a bullet in a note. The slots are fixed and what sits
// inside them is the source's own — so a card always knows where to look, and
// a new collector adds no fields, only fills these differently.

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
}
