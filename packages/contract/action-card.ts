// What the board holds: an item a collector read, plus what I have decided
// about it. A collector never writes any of the second part.

import { z } from "zod";
import { Action, type SourceItem } from "./source-item.ts";

/** Whose turn it is. `now` means mine and nothing else: a card an executor
 *  handed back and one the board has just made now are the same state. */
export const CardState = z.enum(["later", "now", "delegated", "done"]);
export type CardState = z.infer<typeof CardState>;

export interface ActionCard<T extends SourceItem = SourceItem> {
  item: T;
  state: CardState;
  /** The action in force: what a delegated card is delegated for, what a done
   *  card was ended by, null while it is my turn. */
  decision: Action | null;
}
