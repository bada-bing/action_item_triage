import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

export default defineConfig({
  plugins: [svelte()],
  // The run is the server's to read and validate, so the page always asks it
  // rather than reaching for a file itself.
  server: { proxy: { "/api": "http://localhost:3000" } },
});
