// What the Slack collector writes, and what the server accepts from it.

import { z } from "zod";
import type { ActionCard } from "./action-card.ts";
import { Action, type SourceItem } from "./source-item.ts";

/** Anyone a card names. Slack calls them users, and a bot is one — which is
 *  why `is_bot` sits here rather than reading as a contradiction. */
export const User = z.object({
  id: z.string(),
  display: z.string(),
  avatar: z.url().nullish(),
  is_bot: z.boolean().default(false),
});
export type User = z.infer<typeof User>;

/** One reaction, as Slack's API returns it: a skin-tone variant counts as a
 *  reaction of its own. The page groups them back together to draw one chip. */
export const Reaction = z.object({
  /** A glyph, or a `:shortcode:` where the emoji is custom to the workspace
   *  and has none — the run carries the image URL for those. */
  emoji: z.string(),
  count: z.number().int().positive(),
  users: z.array(User),
});
export type Reaction = z.infer<typeof Reaction>;

/** Text exactly as Slack returns it, markup and all — with the two gaps Slack
 *  leaves filled in: a group mention gains its label half, as a user mention
 *  already has, and a standard shortcode becomes its glyph.
 *
 *  An invitation has no message anyone wrote, so the collector states the
 *  event and attributes it to whoever did it, as Slack's own row does. A
 *  channel post and an app's dm both lead with the newest message in the
 *  conversation, since Slack keys them by conversation and not by message. */
export const Message = z.object({
  ts: z.string(),
  text: z.string(),
  author: User,
  /** Empty when there are none — never absent, so nothing needs a guard. */
  reactions: z.array(Reaction).default([]),
});
export type Message = z.infer<typeof Message>;

/** One Activity row. Several fold into one item when they concern the same
 *  message — a reminder and the mention it points at are filed separately. */
export const Reason = z.object({
  reason: z.enum([
    "mention.direct", "mention.group", "mention.broadcast",
    "reply.thread", "reaction", "dm.user", "dm.app",
    "channel.post", "channel.invitation", "reminder",
  ]),
  ts: z.string(),
  /** Slack's own key for the row, kept as provenance. */
  raw: z.string(),
  /** The row's sender. Usually the message's author, but a reaction row's
   *  sender is a reactor and the message is mine. Absent on a reminder row,
   *  which carries no sender at all. */
  actor: User.optional(),
  /** Null on a reaction row, which carries no read control at all. */
  read: z.boolean().nullish(),
});
export type Reason = z.infer<typeof Reason>;

export const Conversation = z.object({
  id: z.string(),
  name: z.string(),
  /** A `G…` prefix is a legacy private channel, not necessarily a group DM,
   *  so the kind is resolved rather than inferred from the id. */
  kind: z.enum(["channel", "dm", "group_dm"]),
  is_private: z.boolean().nullish(),
});
export type Conversation = z.infer<typeof Conversation>;

export const SlackItem = z.object({
  /** What Slack names the notification after: a message, as `channel:ts`, or a
   *  whole conversation for a DM, which Slack gives no ts. Opaque — never read
   *  a message back out of it. */
  id: z.string(),

  content: z.object({
    message: Message,
  }),

  context: z.object({
    location: z.object({
      conversation: Conversation,
      /** The thread's id when the leading message is inside one; null when it
       *  sits in the conversation. A parent that merely has replies is not. */
      thread: z.string().nullable(),
    }),

    /** Ordered, the leading reason first — which is what makes `reasons[0]`
     *  the one the card leads with, and its actor the face it shows. */
    reasons: z.array(Reason).min(1),

    /** The messages around this one. */
    exchange: z.object({
      /** The thread's real length, which the history may not carry in full. */
      reply_count: z.number().int().nonnegative().default(0),
      /** When the conversation last moved. Ordering uses this; it differs from
       *  the newest reason whenever a thread runs on after the notification. */
      last_activity: z.string(),
      /** In order, including this item's own message. A thread is the unit;
       *  otherwise the run-up, bounded by rhythm. */
      history: z.array(Message).default([]),
      /** The thread's opening message, only where this item leads with its
       *  first reply — so it never claims a relationship Slack does not hold. */
      in_reply_to: Message.optional(),
    }),
  }),

  meta: z.object({
    /** The permalink the card opens. */
    ref: z.url(),
  }),

  proposals: z.array(Action),
});
export type SlackItem = z.infer<typeof SlackItem>;

// Fails the build if SlackItem stops satisfying the shape every source shares.
const _conforms: SourceItem = {} as SlackItem;

/** One collection. Every field here has a reader: the collector says which
 *  it is and which of Slack's surfaces it read, what it could not resolve, and
 *  the images for emoji the text cannot carry as characters. */
export const SlackRun = z.object({
  collector: z.literal("slack"),
  surface: z.enum(["activity", "unreads", "later"]),
  /** The moment the collector read the feed to produce this run. */
  collected_at: z.iso.datetime(),
  /** The user groups I belong to. Slack keeps membership on the group rather
   *  than on the user, and exposes it nowhere a collector can read, so this is
   *  configuration: without it a card cannot tell a group mention that reaches
   *  me from one naming a group I am not in. */
  my_user_groups: z.array(z.string()).default([]),
  /** Whoever the collector read the feed as. The card works out what is mine —
   *  which messages, whether I already replied, whose message was reacted to —
   *  by comparing against this, rather than the collector deciding for it. */
  me: User,
  /** What the collector met and could not resolve — a user with no avatar
   *  anywhere, a group id no sweep reached. Shown rather than guessed at. */
  warnings: z.array(z.string()).default([]),
  /** A custom emoji has no character to substitute, so its shortcode stays in
   *  the text and the image is looked up here. Workspace-wide, so it belongs
   *  to the run rather than repeating on every item that uses it. */
  custom_emoji_map: z.record(z.string(), z.url()).default({}),
  items: z.array(SlackItem),
});
export type SlackRun = z.infer<typeof SlackRun>;

/** What the server serves: the run's own fields, with cards in place of the
 *  items it read. Not a schema — a run is validated, a board is assembled. */
export type SlackBoard = Omit<SlackRun, "items"> & {
  cards: ActionCard<SlackItem>[];
};
