// What the server has to say to a page. An announcement has no payload: the
// page pulls the board in answer, so one code path produces its state.

export type Announcement = { kind: "board-changed" };
