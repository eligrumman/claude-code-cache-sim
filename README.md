# Claude Code Cache Simulator

A leveled game that teaches how Claude Code's prompt cache and context economics work: you play
Bob, spending a real (fake) budget across a campaign of levels, watching priced requests hit a
canvas "tape" in real time. Svelte 5 + Vite, deterministic TypeScript pricing engine underneath,
builds to one self-contained offline HTML file.

```
npm install
npm run dev          # local dev server
npx vitest run        # test suite
npx vite build        # produces dist/index.html (single offline file)
```

**See [STATUS.md](./STATUS.md) for everything else**: current state (what's done vs not),
repo layout, the grounding principle behind every dollar figure shown in-game, the QA workflow,
and publishing instructions.

See also [ARCHITECTURE.md](./ARCHITECTURE.md) for the single-file build mechanics.
