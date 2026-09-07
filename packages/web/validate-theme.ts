// Every `var(--x)` a component names must be defined in theme.css. CSS neither
// errors nor warns on a token that is not — the property simply does not apply,
// which is how a renamed colour went unnoticed until somebody looked.

import { Glob } from "bun";

const theme = await Bun.file("src/theme.css").text();
const defined = new Set([...theme.matchAll(/^\s*(--[a-z-]+)\s*:/gm)].map((m) => m[1]!));

const used = new Map<string, string[]>();
for await (const path of new Glob("src/**/*.{svelte,css}").scan(".")) {
  for (const m of (await Bun.file(path).text()).matchAll(/var\((--[a-z-]+)\)/g)) {
    used.set(m[1]!, [...(used.get(m[1]!) ?? []), path]);
  }
}

const dangling = [...used].filter(([token]) => !defined.has(token));
for (const [token, paths] of dangling) {
  console.error(`${token} is not defined in theme.css — used in ${[...new Set(paths)].join(", ")}`);
}

const unused = [...defined].filter((token) => !used.has(token));
if (unused.length) console.log(`unused in theme.css: ${unused.join(", ")}`);

process.exit(dangling.length ? 1 : 0);
