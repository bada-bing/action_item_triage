// Slack timestamps are epoch seconds as a string.

/** Formats a Slack timestamp as a clock time.
 *  `"1788426300.103229"` -> `"11:05"` */
export function formatTime(ts: string): string {
  return new Date(Number(ts) * 1000).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Formats a Slack timestamp as a short date.
 *  `"1788426300.103229"` -> `"Wed, 3 Sep"` */
export function formatDate(ts: string): string {
  return new Date(Number(ts) * 1000).toLocaleDateString([], {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}
