<script lang="ts">
  import type { Action } from "@ait/contract/source-item";

  let {
    proposals,
    decide,
  }: {
    proposals: Action[];
    decide: (action: Action) => void;
  } = $props();

  /** An argument that was already a decision is worth showing. */
  function detail(proposal: Action): string {
    const project = proposal.args.project;
    return typeof project === "string" ? ` → ${project}` : "";
  }
</script>

<div class="proposals">
  {#each proposals as proposal (proposal.name)}
    <button onclick={() => decide(proposal)}>
      {proposal.name}{detail(proposal)}
    </button>
  {/each}
</div>

<style>
  .proposals {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin-top: 0.8rem;
  }
  button {
    font-family: var(--mono);
    font-size: 12.5px;
    color: var(--ink);
    background: var(--btn-bg);
    border: 1px solid transparent;
    border-radius: 6px;
    padding: 5px 13px;
    cursor: pointer;
  }
  button:hover {
    border-color: var(--accent);
    color: var(--accent);
  }
</style>
