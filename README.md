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

## Keep your sessions' cache warm

`bin/cc-keep-warm.mjs` pings idle Claude Code sessions just before their prompt cache expires, so
coming back from lunch reads the cache instead of rebuilding it. It then checks your transcripts to
see whether each return was actually warm, and keeps a ledger of ping spend vs. rebuilds avoided.

```
node bin/cc-keep-warm.mjs --backtest # replay your last 30 days: would it have paid off, and for how long? (free)
node bin/cc-keep-warm.mjs --test     # ping a warm session once; shows what it read and cost
node bin/cc-keep-warm.mjs --watch    # keep idle sessions warm (stops at --max-idle, default 2h)
node bin/cc-keep-warm.mjs --report   # did it pay off?
```

A ping is `claude -p --resume <id> --fork-session --no-session-persistence`: the fork is never saved,
so your transcript and `/resume` list are untouched. It stops pinging a session once pings would
cost more than the rebuild, and disables itself for any session where a ping misses the cache.

See also [ARCHITECTURE.md](./ARCHITECTURE.md) for the single-file build mechanics.
