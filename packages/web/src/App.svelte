<script lang="ts">
  import type { SlackRun } from "@ait/contract/slack";

  const run: Promise<SlackRun> = fetch("/api/run").then((r) =>
    r.ok ? r.json() : r.json().then((e) => Promise.reject(new Error(e.error))),
  );
</script>

{#await run}
  <p>loading…</p>
{:then run}
  <p>{run.items.length} items, collected {run.collected_at}</p>
{:catch error}
  <p>{error.message}</p>
{/await}
