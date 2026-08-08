import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { viteSingleFile } from "vite-plugin-singlefile";

// Build target: ONE self-contained offline dist/index.html.
// - viteSingleFile inlines all JS/CSS into the HTML.
// - assetsInlineLimit set absurdly high so every asset becomes a data: URI.
// - no manual chunks, no code-splitting => nothing is ever fetched at runtime.
export default defineConfig({
  plugins: [svelte(), viteSingleFile()],
  build: {
    target: "es2020",
    assetsInlineLimit: 100000000, // ~100MB: inline everything
    cssCodeSplit: false,
    reportCompressedSize: false,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        manualChunks: undefined,
      },
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
