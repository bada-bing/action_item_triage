// Slack's message markup, as the collector passes it through: `<@U…|Name>`,
// `<#C…|name>`, `<!subteam^S…|@handle>`, `<!channel>`, `<url|label>`.
//
// The collector has already filled a group mention's label and turned standard
// shortcodes into glyphs, so a `:shortcode:` still here is a workspace emoji
// with an image in the run, or not an emoji at all.

/** Who a mention reaches, which decides how loudly it is drawn. */
export type MentionTarget = "user" | "channel" | "group" | "broadcast";

export type Token =
  | { kind: "text"; text: string }
  | {
      kind: "mention";
      label: string;
      target: MentionTarget;
      userId?: string;
      groupId?: string;
    }
  | { kind: "link"; href: string; label: string }
  | { kind: "emoji"; name: string };

const MARKUP = new RegExp(
  [
    "<@(?<user>[UBW][A-Z0-9]+)(?:\\|(?<userLabel>[^>]*))?>",
    "<#(?<channel>C[A-Z0-9]+)(?:\\|(?<channelLabel>[^>]*))?>",
    "<!subteam\\^(?<group>S[A-Z0-9]+)(?:\\|(?<groupLabel>[^>]*))?>",
    "<!(?<broadcast>channel|here|everyone)(?:\\|[^>]*)?>",
    "<(?<href>(?:https?|mailto):[^>|]+)(?:\\|(?<hrefLabel>[^>]*))?>",
    "(?<bareUrl>https?://[^\\s<>()]+)",
    ":(?<emoji>[a-z0-9_+'-]+(?:::skin-tone-\\d)?):",
  ].join("|"),
  "g",
);

/** Returns what a mention shows and who it reaches.
 *  `{user: "U04", userLabel: "ada"}` -> `{label: "@ada", target: "user"}` */
function mentionLabel(
  g: Record<string, string | undefined>,
): { label: string; target: MentionTarget } | null {
  if (g.user) return { label: "@" + (g.userLabel || g.user), target: "user" };
  if (g.channel) return { label: "#" + (g.channelLabel || g.channel), target: "channel" };
  if (g.group) return { label: g.groupLabel || "@" + g.group, target: "group" };
  if (g.broadcast) return { label: "@" + g.broadcast, target: "broadcast" };
  return null;
}

/** Undoes the three HTML entities Slack escapes in message text. Call it
 *  after tokenizing, never before: a message quoting `&lt;@U1&gt;` would
 *  otherwise become a mention of someone it only mentions in words.
 *  `"A &amp; B"` -> `"A & B"` */
function unescape(s: string): string {
  return s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
}

/** Builds the token that one regex match stands for.
 *  `{href: "https://x", hrefLabel: "x"}` -> `{kind: "link", href, label}` */
function tokenOf(g: Record<string, string | undefined>): Token {
  const mention = mentionLabel(g);
  if (mention) {
    return {
      kind: "mention",
      label: unescape(mention.label),
      target: mention.target,
      userId: g.user,
      groupId: g.group,
    };
  }
  const href = g.href ?? g.bareUrl;
  if (href) {
    return { kind: "link", href: unescape(href), label: unescape(g.hrefLabel || href) };
  }
  return { kind: "emoji", name: g.emoji! };
}

/** Splits a message's text into the spans (tokens) a reader sees. Whatever
 *  the regex matches becomes a typed token, and whatever lies between two
 *  matches is plain text.
 *  `"Hi <@U04|ada>"` -> `[{text "Hi "}, {mention "@ada"}]` */
export function tokenize(text: string): Token[] {
  const out: Token[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  MARKUP.lastIndex = 0;
  while ((m = MARKUP.exec(text)) !== null) {
    if (m.index > last) {
      out.push({ kind: "text", text: unescape(text.slice(last, m.index)) });
    }
    out.push(tokenOf(m.groups!));
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ kind: "text", text: unescape(text.slice(last)) });
  return out;
}
