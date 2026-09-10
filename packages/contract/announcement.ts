// What the server has to say to a page: the transitions an action goes
// through. Nothing in an announcement is applied — the page pulls the board in
// answer, whatever the kind — and `because` is there to be read by a person
// watching the socket.

export type Announcement =
  | { kind: "action-delegated"; because: string }
  | { kind: "action-finished"; because: string }
  | { kind: "action-failed"; because: string };
