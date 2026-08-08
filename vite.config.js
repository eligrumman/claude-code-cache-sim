import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { viteSingleFile } from "vite-plugin-singlefile";

// Build target: ONE self-contained offline dist/index.html.
// - viteSingleFile inlines all JS/CSS into the HTML.
// - assetsInlineLimit set absurdly high so every asset becomes a data: URI.
// - no manual chunks, no code-splitting => nothing is ever fetched at runtime.
export default defineConfig({
  css: {},
  plugins: [svelte(), viteSingleFile()],
  // Under vitest, force Vite's module resolution to pick each package's
  // "browser" export condition (Svelte's client runtime) instead of its
  // default/node condition (the SSR runtime) - otherwise @testing-library/
  // svelte's `mount()` hits Svelte's server-only build and throws
  // lifecycle_function_unavailable. Test-only; unrelated to `npx vite build`.
  resolve: process.env.VITEST ? { conditions: ["browser"] } : undefined,
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
    // jsdom globally: the pure-logic engine/game tests don't touch the DOM
    // so this is a no-op for them, and it lets Svelte's client (not SSR)
    // runtime resolve for the new component/e2e tests without a second
    // Vite config file. This is devDependency-only test infra - it never
    // touches the production single-file build (vite.config.js `build`
    // above has no test-only imports).
    environment: "jsdom",
    include: ["src/**/*.test.ts"],
    setupFiles: ["src/test-setup.dom.ts"],
  },
});
