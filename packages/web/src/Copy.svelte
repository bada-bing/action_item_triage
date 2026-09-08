<script lang="ts">
  let { text, label = "copy" }: { text: string; label?: string } = $props();

  let copied = $state(false);
  let clearing: ReturnType<typeof setTimeout>;

  async function copy() {
    await navigator.clipboard.writeText(text);
    copied = true;
    clearTimeout(clearing);
    clearing = setTimeout(() => (copied = false), 1200);
  }
</script>

<button onclick={copy} class:copied>{copied ? "copied" : label}</button>

<style>
  button {
    font-family: var(--mono);
    font-size: 12px;
    color: var(--muted);
    background: none;
    border: 1px solid var(--line);
    border-radius: 5px;
    padding: 3px 9px;
    cursor: pointer;
    white-space: nowrap;
  }
  button:hover {
    color: var(--accent);
    border-color: var(--accent);
  }
  .copied {
    color: var(--accent);
    border-color: var(--accent);
    background: var(--accent-soft);
  }
</style>
