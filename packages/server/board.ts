// A board is one card per item in the collector's run, plus what I decided
// about each. It lives only in memory: restarting ends the sitting, and an
// undisposed card comes back next time because its notification is still
// uncleared.

import type { ActionCard } from "@ait/contract/action-card";
import type { Action } from "@ait/contract/source-item";
import type { SlackItem, SlackRun } from "@ait/contract/slack";

/** The actions something can carry out. One that is not is refused rather than
 *  accepted and left half done. */
const knownActions = new Set(["dismiss"]);

export function openBoard(run: SlackRun) {
  const cards: ActionCard<SlackItem>[] = run.items.map((item) => ({
    item,
    state: "later",
    decision: null,
  }));

  /** If no card is `now`, make the first `later` one now. Items arrive newest
   *  first, so that is the one up, and running this after every change is what
   *  makes finishing or delegating advance the queue. */
  function ensureBoardHasNowCard(): void {
    if (cards.some((card) => card.state === "now")) return;
    const next = cards.find((card) => card.state === "later");
    if (next) next.state = "now";
  }

  ensureBoardHasNowCard();

  return {
    cards,

    /** The card waits while the action is carried out, then lands where the
     *  action says. Handing it back is my turn again, so it holds no decision. */
    async executeAction(id: string, action: Action): Promise<boolean> {
      // Neither can be reached through the page, so either means a bug.
      const card = cards.find((c) => c.item.id === id);
      if (!card) {
        console.error(`no such card: ${id}`);
        return false;
      }
      if (!knownActions.has(action.name)) {
        console.error(`unknown action: ${action.name}`);
        return false;
      }

      card.state = "delegated";
      card.decision = action;
      ensureBoardHasNowCard();

      // A placeholder: nothing carries an action out yet.

      card.state = action.resolves ? "done" : "now";
      card.decision = action.resolves ? action : null;
      ensureBoardHasNowCard();
      return true;
    },
  };
}
