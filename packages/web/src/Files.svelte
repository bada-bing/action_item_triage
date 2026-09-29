<script lang="ts">
  import type { File } from "@ait/contract/slack";

  /** What a message carries besides its text. Only the file's name, type and
   *  size travel, so a card says a file is there and what it is — which is
   *  what keeps a message that is only an image from reading as empty. */
  let { files }: { files: File[] } = $props();
</script>

<ul class="files">
  {#each files as file (file.id)}
    <li><span class="clip">📎</span> {file.name} <span class="meta">· {file.type} · {file.size}</span></li>
  {/each}
</ul>

<style>
  .files {
    list-style: none;
    margin: 0.35rem 0 0;
    padding: 0;
    font-size: 0.85rem;
  }
  .meta {
    color: var(--muted);
  }
  .clip {
    font-size: 0.8rem;
  }
</style>
