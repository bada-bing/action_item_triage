// The board: the collector's run, plus the state of each card.
//
// State is held for the length of a sitting and nowhere else. Restarting the
// server ends the sitting, which costs nothing: an undisposed card comes back
// because its notification is still uncleared, and the sources are the record.

import { CardState, type ActionCard } from "@ait/contract/action-card";
import type { SlackItem, SlackRun } from "@ait/contract/slack";

const state = new Map<string, CardState>();

/** A `later` card is promoted only when no card is `now`, so finishing or
 *  delegating the card in front of me is what advances the queue. Items arrive
 *  newest first, so the first `later` is the next one up. */
function ensureBoardHasNowCard(cards: ActionCard<SlackItem>[]): void {
  if (cards.some((card) => card.state === "now")) return;
  const next = cards.find((card) => card.state === "later");
  if (next) {
    next.state = "now";
    state.set(next.item.id, "now");
  }
}

export function build(run: SlackRun): ActionCard<SlackItem>[] {
  const cards = run.items.map((item) => ({
    item,
    state: state.get(item.id) ?? "later",
  }));
  ensureBoardHasNowCard(cards);
  return cards;
}

/** Records a decision. The board is rebuilt afterwards, which is where the
 *  promotion rule runs. */
export function decide(id: string, next: CardState): void {
  state.set(id, next);
}
