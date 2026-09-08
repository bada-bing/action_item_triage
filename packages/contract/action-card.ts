// What the board holds: an item a collector read, plus what I have decided
// about it. A collector never writes any of the second part.

import { z } from "zod";
import type { SourceItem } from "./source-item.ts";

/** Whose turn it is. `now` means mine and nothing else: a card an executor
 *  handed back and one the board has just made now are the same state. */
export const CardState = z.enum(["later", "now", "delegated", "done"]);
export type CardState = z.infer<typeof CardState>;

export interface ActionCard<T extends SourceItem = SourceItem> {
  item: T;
  state: CardState;
}

/** A decision the page sends about one card. */
export const CardDecision = z.object({
  id: z.string(),
  state: CardState,
});
export type CardDecision = z.infer<typeof CardDecision>;
