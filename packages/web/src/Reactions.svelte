<script lang="ts">
  import type { Reaction, User } from "@ait/contract/slack";

  let {
    reactions,
    me,
    emoji,
  }: {
    reactions: Reaction[];
    me: User;
    emoji: Record<string, string>;
  } = $props();

  /** A workspace emoji has no character to show, so the run carries an image
   *  and the shortcode stays in `emoji` as its key. */
  const imageFor = (glyph: string) => emoji[glyph.replace(/^:|:$/g, "")];

  /** Slack returns a skin-tone variant as its own reaction and draws them as
   *  one chip, so they group on the glyph with the tone stripped. */
  const SKIN_TONE = /[\u{1F3FB}-\u{1F3FF}]/gu;

  const grouped = $derived.by(() => {
    const groups = new Map<
      string,
      { glyphs: string[]; count: number; users: User[] }
    >();
    for (const reaction of reactions) {
      const key = reaction.emoji.replace(SKIN_TONE, "");
      const group = groups.get(key) ?? { glyphs: [], count: 0, users: [] };
      group.glyphs.push(reaction.emoji);
      group.count += reaction.count;
      group.users.push(...reaction.users);
      groups.set(key, group);
    }
    return [...groups];
  });
</script>

<div class="reactions">
  {#each grouped as [key, group] (key)}
    <span
      class="rx"
      class:mine={group.users.some((u) => u.id === me.id)}
      title={group.users.map((u) => u.display).join(", ")}
    >
      <span class="stack">
        {#each group.glyphs as glyph (glyph)}
          <span class="glyph">
            {#if imageFor(glyph)}
              <img src={imageFor(glyph)} alt={glyph} />
            {:else}{glyph}{/if}
          </span>
        {/each}
      </span>
      <span class="count">{group.count}</span>
    </span>
  {/each}
</div>

<style>
  .reactions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
    margin-top: 0.6rem;
  }
  .rx {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 999px;
    padding: 1px 8px;
    font-size: 13px;
    line-height: 1.6;
  }
  .rx.mine {
    border-color: var(--accent);
    background: var(--accent-soft);
  }
  /* Variants overlap, so a chip stays chip-sized however many tones were used. */
  .stack {
    display: inline-flex;
    align-items: center;
  }
  .stack .glyph + .glyph {
    margin-left: -0.45em;
  }
  /* An emoji carries more side bearing than an image, so both take one box. */
  .glyph {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.15em;
    height: 1.15em;
    line-height: 1;
  }
  .glyph img {
    max-width: 100%;
    max-height: 100%;
    display: block;
  }
  .count {
    font-family: var(--mono);
    font-size: 11px;
    color: var(--muted);
  }
  .rx.mine .count {
    color: var(--accent);
  }
</style>
