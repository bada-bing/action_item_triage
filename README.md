# action_item_triage

Turns the notifications I receive into action items of one shape, and runs the sitting
in which I dispose of them.

## The four parts

| Path | Is | Does |
|------|----|------|
| `collectors/slack/` | a Claude session | works Slack, writes a batch to `out/` |
| `packages/server/` | a Bun process | watches `out/`, holds the batch, serves the page |
| `packages/web/` | a Svelte app | renders the batch, takes my decision on each item |
| `orchestrator/` | a Claude session | runs the loop, executes proposals, closes the sitting |

`packages/contract/` holds the wire shape both sides agree on — a JSON Schema, since the
collector validates in Python and the server in TypeScript, plus the types generated from
it.

The flow is one direction: **collector writes a file → server ingests and pushes → I decide
in the browser → server records → orchestrator executes.** A collector never reaches the
surface, and the surface never executes anything.

## State

Nothing persists between sittings. A batch lives in memory for as long as the sitting does
and is then dropped: an item I did not dispose of comes back next time because its
notification is still in Slack. Clearing it there is the only thing that records completion,
which is why the close-out is part of the sitting rather than tidying afterwards.
