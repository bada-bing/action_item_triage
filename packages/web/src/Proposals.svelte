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

<hr />

<div class="proposals">
  {#each proposals as proposal (proposal.name)}
    <button onclick={() => decide(proposal)}>
      {proposal.name}{detail(proposal)}
    </button>
  {/each}
</div>

<style>
  /* Separates what happened from what can be done about it. */
  hr {
    border: none;
    height: 10px;
    border-radius: 5px;
    background: var(--line);
    margin: 0.9rem 0 0;
  }
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
