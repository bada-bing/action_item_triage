import type { User } from "@ait/contract/slack";
import slackMark from "./icons/slack-mark.svg";

/** The picture to draw for someone. Slackbot has no avatar anywhere in the
 *  feed, and initials for it would read as a person who could not be resolved,
 *  so it gets Slack's own mark instead.
 *  `{id: "USLACKBOT"}` -> the Slack mark */
export function faceOf(user: User): string | null {
  if (user.avatar) return user.avatar;
  return user.id === "USLACKBOT" ? slackMark : null;
}
