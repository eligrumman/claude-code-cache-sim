# cache_scan.py

Standalone, read-only Python 3 CLI that scans Claude Code session
transcripts and extracts raw per-turn token/cache/timing data — the raw
material needed to (a) calculate prompt-cache cost and (b) forecast cost
for keep-warm calibration. Single file, standard library only, no pip
dependencies. Runs anywhere Python 3.9+ is installed.

## What it does

Claude Code writes JSONL transcripts under `~/.claude/projects/` in
three shapes, all of which `cache_scan.py` discovers **recursively**
(`Path(projects_dir).rglob("*.jsonl")`, scoped strictly to the projects
dir — it does not broaden to `~/.claude` at large, so it never pulls in
`history.jsonl`, `jobs/**/timeline.jsonl`, plugin logs, etc.):

- `<slug>/<session>.jsonl` — a main session transcript
- `<slug>/<session>/subagents/<agent>.jsonl` — a subagent transcript
- `<slug>/<session>/subagents/workflows/<wf>/<agent>.jsonl` — a nested
  workflow-subagent transcript

Each line is a JSON record; assistant turns carry token usage under
`message.usage`.

`cache_scan.py` walks every discovered file, pulls out each assistant
turn's usage numbers, **deduplicates cumulative streaming usage lines**
(see below), sorts turns within a session by timestamp, computes the
gap since the previous turn, and flags turns where a cache write
happened after the active TTL had already expired with no cache read
(`cache_miss_after_gap`) — i.e. a cold rebuild a warm-keeper would have
avoided.

It never reads message/prompt/tool-output TEXT. Only numeric usage
fields, timestamps, model names, and ids are touched or emitted.

### requestId dedup (streaming cumulative usage)

Claude Code emits cumulative streaming usage chunks: the same assistant
turn can appear on multiple JSONL lines, each carrying a running-total
usage snapshot rather than a delta. Naively summing every line
double-counts tokens. `cache_scan.py` groups lines by top-level
`requestId` (falling back to `message.id` when `requestId` is absent)
and takes the **max** of each usage field across the group — the max is
the final cumulative total for that turn — emitting exactly one row per
requestId/turn. Records with neither `requestId` nor `message.id` are
kept as their own undeduped row (matches ccusage's fallback). This
mirrors the dedup approach used by ccusage and token-optimizer. On a
real sample session file on this machine, this reduced 3,292 raw
assistant-usage lines to 1,649 unique requestIds/turns — i.e. the raw
data really does double-count roughly 2x without this dedup.

### is_subagent / transcript_kind classification

Like ccusage, token-optimizer, and Total Recall, `cache_scan.py`
classifies transcripts by **file path**, not the `isSidechain` field
(all three mature tools ignore `isSidechain` as unreliable). A file is
classified `is_subagent=True` when its path contains a `subagents`
segment or its filename stem starts with `agent-`; `transcript_kind` is
`"main"`, `"subagent"`, or `"workflow_subagent"` (path contains
`subagents/workflows`).

## Running it

```bash
# Summary of all sessions found under the default projects dir
python3 cache_scan.py --summary

# Same, but only sessions touched in the last 14 days
python3 cache_scan.py --since 14 --summary

# Export raw rows for moving between machines
python3 cache_scan.py --out cache_scan_data.jsonl
python3 cache_scan.py --csv cache_scan_data.csv

# On a different machine / different home dir
python3 cache_scan.py --projects-dir /path/to/.claude/projects --summary
```

No install step — copy `cache_scan.py` to the target machine and run it
with any Python 3.9+ (`python3 cache_scan.py ...`).

### Flags

| Flag | Meaning |
|---|---|
| `--projects-dir PATH` | Root of per-project session folders. Default `~/.claude/projects`. |
| `--since DAYS` | Only scan `.jsonl` files modified in the last N days (by file mtime). |
| `--out PATH` | Write one JSON object per turn (JSONL) to PATH. |
| `--csv PATH` | Write the same rows as CSV to PATH. |
| `--summary` | Print per-session (top 20 by cache-creation volume), grand totals, and a main-vs-subagent-vs-workflow_subagent breakdown to stdout. Runs by default if neither `--out` nor `--csv` is given. |

## Output columns

One row per assistant turn:

| Column | Meaning |
|---|---|
| `project_slug` | Name of the project folder under `--projects-dir` (Claude Code's slugified cwd). |
| `file_path` | Absolute path to the source `.jsonl` session file. |
| `session_id` | Session UUID (`sessionId` in the record; matches the filename). |
| `turn_index` | Sequential index of this assistant turn within the session, 0-based, ordered by timestamp. There is no native turn-number field in the raw data — this is derived. |
| `uuid` | The record's own UUID (`uuid`). |
| `parent_uuid` | UUID of the parent record in the conversation tree (`parentUuid`). |
| `request_id` | API request id (`requestId`), e.g. `req_011C...`. |
| `timestamp` | ISO8601 UTC timestamp of the turn. |
| `model` | Model name from `message.model`, e.g. `claude-opus-4-8`. Confirmed present on every assistant record. |
| `input_tokens` | Uncached, full-price input tokens (`message.usage.input_tokens`). |
| `cache_read_input_tokens` | Tokens served from cache this turn. |
| `cache_creation_input_tokens` | Total tokens written to cache this turn (sum of the two TTL buckets below). |
| `cache_creation_1h` | Portion of the cache write that went to the 1-hour TTL bucket (`cache_creation.ephemeral_1h_input_tokens`). |
| `cache_creation_5m` | Portion of the cache write that went to the 5-minute TTL bucket (`cache_creation.ephemeral_5m_input_tokens`). |
| `output_tokens` | Tokens generated this turn. |
| `gap_seconds` | Seconds since the previous assistant turn in the same session; `null`/empty for the first turn. |
| `active_ttl_seconds` | TTL (in seconds) inferred as active for this turn's cache write (3600 for 1h-bucket writes, 300 for 5m-bucket writes; defaults to 300 when neither bucket got tokens). |
| `cache_miss_after_gap` | `true` when `gap_seconds` exceeded `active_ttl_seconds` AND `cache_read_input_tokens == 0` AND `cache_creation_input_tokens` exceeded the 5000-token noise floor — i.e. a full cold rebuild that a warm cache would have avoided. |
| `is_subagent` | `true` when the source file's path contains a `subagents` segment, or the filename stem starts with `agent-`. Classified by path, not `isSidechain`. |
| `transcript_kind` | `"main"`, `"subagent"`, or `"workflow_subagent"` (path contains `subagents/workflows`). |

## Confirmed schema (verified against real transcript files, 2026-08-22)

- **Model name**: lives at `message.model` on every assistant record
  (e.g. `"claude-opus-4-8"`, `"claude-fable-5"`). Confirmed present, not
  inferred.
- **Session id / message id / sequence number**: `sessionId` (top
  level) identifies the session and matches the `.jsonl` filename.
  `uuid` is the record's own id; `parentUuid` links to the previous
  record in the conversation tree, forming a linked list/tree rather
  than a flat sequence. There is **no** explicit sequence-number field
  — `turn_index` in the output is derived by sorting each session's
  assistant records by `timestamp` (file order as tiebreak) and
  assigning an incrementing index. `requestId` is also present
  (`req_011C...`) and is a useful secondary correlation key since one
  `requestId` can span multiple record entries for the same API call.
- **Cache bucket split**: `message.usage.cache_creation.ephemeral_1h_input_tokens`
  and `.ephemeral_5m_input_tokens` are present and correctly sum to
  `cache_creation_input_tokens` in every record inspected.

## Privacy note

The tool never reads prompt or message text, tool inputs/outputs, file
contents, or any other conversational content — only the numeric usage
block, timestamps, model name, and the id fields listed above. The
JSONL/CSV output is safe to copy off-machine or share for cost analysis
without exposing conversation contents.

---

# calibrate.py

Consumes `cache_scan.py`'s JSONL output and forecasts, **per session**,
whether keeping the prompt cache warm is worth it, in which TTL mode (5m
vs 1h), and what it would save. Same constraints as `cache_scan.py`:
single file, standard library only, Python 3.9+, no network calls.

## Why tokens, not dollars

The primary output is denominated in **tokens** — this user is on a Max
subscription, so quota-token cost is what matters, not API dollar
pricing. A secondary, clearly-labeled dollar view is available via
`--show-dollars` / `--pricing` for reference only.

## Running it

```bash
# 1. Produce raw scan data
python3 cache_scan.py --out cache_scan_data.jsonl

# 2. Calibrate against it
python3 calibrate.py cache_scan_data.jsonl --top 10 --json calibrate_out.jsonl

# Reproducible "now" for testing, custom active window, dollar view
python3 calibrate.py cache_scan_data.jsonl --now 2026-08-22T00:00:00Z \
    --active-within 48 --show-dollars
```

### Flags

| Flag | Meaning |
|---|---|
| `in_path` / `--in PATH` | Path to the `cache_scan.py` JSONL output (positional or `--in`). |
| `--now ISO_TIMESTAMP` | Override "current time" for the recency/ACTIVE check (reproducible testing). Default: current UTC time. |
| `--active-within HOURS` | Sessions whose last turn is within this many hours are flagged `ACTIVE` (default 24). Only active sessions are realistic live keep-warm candidates. |
| `--top N` | Print the top N warm-worthy sessions by projected net token savings (default 10). |
| `--json PATH` | Write one forecast object per session (JSONL) to PATH. |
| `--pricing PATH` | Optional JSON file overriding the illustrative `$/Mtok` rates used by `--show-dollars`. |
| `--show-dollars` | Also print an illustrative (secondary) dollar view of the projected savings. |

## The cost model (all assumptions stated explicitly)

**Token multipliers** (relative to 1 base input token = `1.0`), constants
at the top of `calibrate.py`:

| Multiplier | Value | Meaning |
|---|---|---|
| `CACHE_READ_MULTIPLIER` | `0.1` | Cost of a cache hit |
| `CACHE_WRITE_5M_MULT` | `1.25` | Cost of a cache write to the 5-minute TTL bucket |
| `CACHE_WRITE_1H_MULT` | `2.0` | Cost of a cache write to the 1-hour TTL bucket |

**These are not an officially published quota weighting.** Anthropic
does not publish how cache read/write tokens are weighted against a Max
subscription's quota. The values above borrow the *relative ratios* from
published per-token API list pricing and apply them to token counts
instead of dollars, as the best available proxy. If Anthropic publishes
(or you determine) different quota weighting, edit these three constants
— nothing else in the model needs to change.

**Prefix-size estimate.** There is no direct signal for "the warm prefix
size that must persist." `calibrate.py` approximates it as the **median**
of `(cache_read_input_tokens + cache_creation_input_tokens)` across a
session's turns (median, not mean, for robustness against one-off huge
turns). This is a proxy, not a measurement — treat it as directional.

**Per-gap warm/no-warm tradeoff**, evaluated separately for 5m-mode and
1h-mode against every observed inter-turn gap in a session's history:

- *Cost of warming a gap*: to hold the cache alive across an idle gap of
  `G` seconds you must fire a refresh ping every `TTL - margin` seconds
  (margin = 300s for 1h TTL, 60s for 5m TTL — mirrors the real system's
  safety margins). `pings_needed = ceil(G / (TTL - margin))`; each ping
  costs a cache **read** of the prefix: `pings_needed * prefix_tokens *
  0.1`.
- *Saving of warming a gap*: without warming, returning after `G > TTL`
  pays a full cache **creation** rebuild (`prefix_tokens * write_mult`);
  with warming it instead pays a cache **read** (`prefix_tokens * 0.1`).
  Net saving = `prefix_tokens * (write_mult - 0.1) - ping_cost`. Gaps
  that never exceed the TTL need no pings and contribute nothing (the
  cache already survives naturally).
- Per-session totals for 5m-mode and 1h-mode are the sum of this
  per-gap saving over every gap actually observed in that session's
  history.

**Recommendation**: whichever of `WARM-5M` / `WARM-1H` has the larger
positive projected total wins; if neither is positive, `DONT_WARM`.
Sessions with almost all sub-5-minute gaps naturally have ~zero
projected savings under either mode (nothing to rebuild), so they come
out `DONT_WARM`.

**Recency / ACTIVE flag**: `last_turn_ago_seconds = now - max(timestamp)`
for the session; flagged `ACTIVE` if within `--active-within` hours
(default 24). Only `ACTIVE` sessions are realistic keep-warm candidates
in practice — a session with no live process to ping has nothing to
warm — but the projection is still reported for inactive sessions so the
underlying gap-pattern data stays visible; filter on `active` in the
`--json` output if you only want live candidates.

**Honesty check on the magnitudes.** The per-session projected-savings
total sums the per-gap saving over *every gap ever observed in that
session's full history*, not a forward-looking daily/ongoing estimate.
Long-lived sessions with thousands of turns and hundreds of >5-minute
gaps therefore produce very large cumulative numbers — real observed run
against this repo's own `~/.claude/projects` data produced 5m-mode
totals in the hundreds of millions of tokens for a handful of very long
investor-project sessions. That is **not** a "tokens you will save
tomorrow" number — it is "tokens that would have been saved, in this
model, had every one of this session's historical gaps been bridged with
pings." Treat the per-session numbers as a *ranking signal* (which
sessions have the gap patterns and prefix sizes that make warming
worthwhile) rather than a literal forecast of future savings, and note
that almost none of the top-ranked sessions in a typical run are
`ACTIVE` — they're large closed-out sessions, useful for understanding
historical waste, not present keep-warm targets.

## Output (per-session forecast object)

Each line of `--json` output (and the console summary) reports:
`session_id`, `project_slug`, `file_path`, `models`, `turns`,
`prefix_tokens_estimate`, `gap_count`, `gaps_over_5m`, `gaps_over_1h`,
`gaps_5m_to_30m`, `gaps_1h_to_3h`, `historical_cold_rebuild_events`,
`historical_cold_rebuild_tokens` (realized waste, straight from
`cache_scan.py`'s own `cache_miss_after_gap` flag — a fact, not a
forecast), `projected_net_savings_tokens_5m_mode`,
`projected_net_savings_tokens_1h_mode`, `recommendation`,
`last_turn_timestamp`, `last_turn_ago_seconds`, `active`.

## Running the two tools together

```bash
python3 tools/cache-scan/cache_scan.py --out /tmp/cache_scan_data.jsonl
python3 tools/cache-scan/calibrate.py /tmp/cache_scan_data.jsonl \
    --top 10 --json /tmp/calibrate_out.jsonl --show-dollars
```

## Real output (2026-08-22 run against this machine's `~/.claude/projects`)

184,219 turn-rows scanned across 6,895 sessions. Top result:

```
- [WARM-5M] -Users-user-investor / ef5d93fc-fd61-4ed2-a723-edff640ece7b (inactive)
    turns=4662 prefix_est=482156tok gaps>5m=1003 gaps>1h=0 gaps(5-30m)=1003 gaps(1-3h)=0
    historical_cold_rebuilds=0 (tokens=0)
    projected_net_savings: 5m-mode=412315703tok 1h-mode=0tok last_turn_ago=436.9h
```

Grand summary:

```
sessions analyzed:                6895
  recommended WARM-5M:             155  (projected net savings: 2510473850 tokens)
  recommended WARM-1H:             122  (projected net savings: 234123331 tokens)
  recommended DONT_WARM:           6618
  of the warm-worthy, ACTIVE now (last turn <= 24h ago): 2
TOTAL projected net token savings if all recommendations applied: 2744597180 tokens
(for reference) historical cold-rebuild events already observed: 608
(for reference) historical cold-rebuild tokens already spent:    140640125
```

Per the honesty note above: only **2** of the 277 warm-worthy sessions
were `ACTIVE` at run time. The huge cumulative token totals come from a
handful of very long-lived, now-closed `investor` project sessions with
thousands of turns and hundreds of >5-minute gaps each — they are a
useful signal about historical gap patterns and cache-rebuild waste, not
a claim that ~2.7 billion tokens are recoverable going forward. For an
actionable "should I warm this right now" view, filter the `--json`
output to `active: true`.

# return_patterns.py

Standalone, read-only Python 3 CLI that answers: "at what times of the
week is the user likely to RETURN to and continue a session, broken down
per project?" This is the temporal-return-pattern piece of a cache
keep-warm analyzer — it tells a warmer *when* to bother pinging a
project, as opposed to `calibrate.py`, which tells it *whether* warming
a given session is worth the tokens at all. Standard library only, no
pip dependencies, clean-room (does not share code with `cache_scan.py`
beyond both reading the same JSONL row schema).

## What it does

It reads the per-turn JSONL produced by `cache_scan.py` and, per
`project_slug`, distinguishes two kinds of turn:

- a **continuation** turn — `gap_seconds` is small, the session was
  already in active use;
- a **RETURN event** — `gap_seconds` is larger than
  `--return-threshold-min` (default 30 minutes) — the user came back to
  the project after being away. These are the events that predict future
  returns and are what a warmer should care about; continuation turns
  are not informative about "when will they come back."

For each project it computes:

1. A 7×24 (day-of-week × hour-of-day) heatmap of **all** turns, in local
   time.
2. A separate 7×24 heatmap of **RETURN events only**.
3. The top N `(day, hour)` windows ranked by return-event frequency,
   e.g. `Sat 07:00-08:00`.
4. Median and p75 gap length of return events, the total return-event
   count, and recency (hours since the project's last turn, so you know
   if it's still active).
5. A **concentration/predictability score**: the fraction of a
   project's return-event mass held by its busiest 5 heatmap cells (out
   of 168), against a uniform baseline of 5/168 ≈ 3%. High concentration
   (roughly ≥50%) means returns cluster into a few predictable windows —
   a good keep-warm candidate. Low concentration (most real projects, in
   practice) means returns are spread across many hours — pinging on a
   schedule would frequently miss, or would need to run near-continuously
   to catch the user, which defeats the point of warming.

### Timezone handling

Raw timestamps in the scan JSONL are UTC. Weekly day/hour patterns are
meaningless in UTC unless the user is physically in UTC, so every
timestamp is converted to a **local** timezone before bucketing. The
local zone defaults to the machine's system local timezone
(`datetime.now().astimezone().tzinfo`) and is overridable with `--tz
<IANA name>` (resolved via the stdlib `zoneinfo` module). The resolved
zone is always printed in the report header (e.g. `IDT`) so results are
never silently mis-labeled.

## CLI

```bash
python3 return_patterns.py --in /path/to/cache_scan_data.jsonl \
    --return-threshold-min 30 \
    --tz Asia/Jerusalem \
    --top-projects 15 --top-windows 5 \
    --json /tmp/return_patterns_out.jsonl
```

- `--in PATH` (required) — scan JSONL from `cache_scan.py`.
- `--return-threshold-min N` — gap minutes above which a turn counts as
  a RETURN (default 30).
- `--tz NAME` — override local timezone (default: system local tz).
- `--top-projects N` — only show the N most-active projects by turn
  volume (default 15).
- `--top-windows N` — return windows to list per project (default 5).
- `--json OUT` — write one per-project pattern object per line.
- Default (no `--json`): prints a readable per-project report — return
  windows, gap stats, recency, predictability, and a compact ASCII
  heatmap (rows = Mon..Sun, cols = hour 0-23 local, density chars
  ` .:-=+*#%@` low→high) for both all-activity and return-events-only.

## Honesty / limitations

- A historical return-time pattern is a **weak predictor** of any single
  future return — it describes a tendency across sampled history, not a
  scheduled commitment. Use it to bias warm-ping timing
  probabilistically, never as a guarantee.
- Small-sample projects (few return events) produce noisy heatmaps and
  unstable top-windows/concentration numbers; the tool does not enforce
  a minimum count, but always reports the return-event count so low
  confidence is visible, never hidden.
- Sessions that span timezones (the user traveling) are still bucketed
  under whatever local offset applies to that instant in the resolved
  zone — this tool has no way to know the user was physically elsewhere
  at the time.
- The system-local-tz default is a snapshot at run time; it does not
  retroactively account for a user having lived in a different zone
  earlier in the scanned history.

## Real output (2026-08-22 run against this machine's `~/.claude/projects`)

184,232 turn-rows scanned. Local timezone resolved as `IDT`. Top 5
projects by turn volume, return-threshold = 30 minutes:

```
PROJECT: -Users-user-investor
  total turns: 111041
  return events (gap > threshold): 1461
  return gap length: median=1.0h p75=3.0h
  last turn: 19.8h ago (ACTIVE)
  predictability: DIFFUSE (unpredictable — warming likely wastes pings); top-5 cells hold 6% of returns (uniform baseline 3%)
  top 5 likely-return windows:
    - Fri 12:00-13:00  (20 return event(s))
    - Sat 07:00-08:00  (20 return event(s))
    - Sun 03:00-04:00  (17 return event(s))
    - Sat 08:00-09:00  (16 return event(s))
    - Mon 03:00-04:00  (16 return event(s))

PROJECT: -Users-user-agents-total-recall-core
  total turns: 15432
  return events (gap > threshold): 149
  return gap length: median=3.3h p75=8.7h
  last turn: 302.0h ago (inactive)
  predictability: DIFFUSE (unpredictable — warming likely wastes pings); top-5 cells hold 12% of returns (uniform baseline 3%)
  top 5 likely-return windows:
    - Sat 21:00-22:00  (5 return event(s))
    - Sun 18:00-19:00  (4 return event(s))
    - Sat 09:00-10:00  (3 return event(s))
    - Wed 15:00-16:00  (3 return event(s))
    - Mon 21:00-22:00  (3 return event(s))

PROJECT: -Users-user-Library-CloudStorage-GoogleDrive-eligro91-gmail-com-My-Drive-life-os
  total turns: 15291
  return events (gap > threshold): 263
  return gap length: median=1.4h p75=9.7h
  last turn: 2112.7h ago (inactive)
  predictability: DIFFUSE (unpredictable — warming likely wastes pings); top-5 cells hold 10% of returns (uniform baseline 3%)
  top 5 likely-return windows:
    - Sun 17:00-18:00  (6 return event(s))
    - Fri 08:00-09:00  (6 return event(s))
    - Sun 18:00-19:00  (6 return event(s))
    - Sun 11:00-12:00  (4 return event(s))
    - Thu 17:00-18:00  (4 return event(s))

PROJECT: -Users-user-agents-total-recall
  total turns: 9316
  return events (gap > threshold): 73
  return gap length: median=2.1h p75=5.8h
  last turn: 1925.0h ago (inactive)
  predictability: DIFFUSE (unpredictable — warming likely wastes pings); top-5 cells hold 15% of returns (uniform baseline 3%)
  top 5 likely-return windows:
    - Sat 15:00-16:00  (3 return event(s))
    - Sat 00:00-01:00  (2 return event(s))
    - Sat 09:00-10:00  (2 return event(s))
    - Tue 14:00-15:00  (2 return event(s))
    - Wed 08:00-09:00  (2 return event(s))

PROJECT: -Users-user-agents-total-recall.bak
  total turns: 9169
  return events (gap > threshold): 69
  return gap length: median=2.1h p75=5.6h
  last turn: 1997.7h ago (inactive)
  predictability: DIFFUSE (unpredictable — warming likely wastes pings); top-5 cells hold 16% of returns (uniform baseline 3%)
  top 5 likely-return windows:
    - Sat 15:00-16:00  (3 return event(s))
    - Sat 00:00-01:00  (2 return event(s))
    - Sat 09:00-10:00  (2 return event(s))
    - Fri 01:00-02:00  (2 return event(s))
    - Tue 09:00-10:00  (2 return event(s))
```

Honest read of these numbers: even the busiest project (`investor`,
1461 return events) is **DIFFUSE** — its top 5 hourly windows only
account for 6% of returns, barely above the 3% uniform baseline. None
of the top 5 projects here show a concentrated, schedule-like return
pattern. That is itself the answer to "have you seen periods in the
week when I'm likely to be back, per project": for this user's real
history, return timing is close to uniformly spread across the week
(with a mild lean toward Friday/Saturday/Sunday for a couple of
projects) rather than clustered into a few strong daily windows. A
warmer built on this data should treat "day-of-week x hour" scheduling
as a weak tiebreaker at most, not a primary keep-warm strategy — recency
(is the project active in the last day) is a much stronger signal here
than time-of-week.

# gap_patterns.py

Standalone, read-only Python 3 CLI that answers the same underlying
question as `return_patterns.py` -- "when do gaps happen, and do they turn
into returns?" -- but **pooled globally across every project and
session**, instead of per-project. Per-project return counts turned out
too sparse and diffuse to see stable structure in (see the DIFFUSE
verdicts above); pooling everything into one population is what makes a
survival/hazard analysis possible. Standard library only, no pip
dependencies, clean-room.

## What it does

Reads the `cache_scan.py` per-turn JSONL. For every session, sorts turns
by `turn_index`/timestamp and derives two kinds of gap event:

- a **realized gap** -- the interval between one turn and the next turn in
  the same session (this is exactly `gap_seconds` from `cache_scan.py`,
  which is already computed per-session). It "resolved" because a next
  turn exists.
- a **censored trailing idle** -- every session's *last* turn has no
  following turn in the data. That open period is right-censored: we
  know the user went idle, but not whether/when they ever came back. This
  tool always counts these explicitly (one per session) rather than
  dropping them -- dropping them would bias every rate toward "always
  returns."

Six pooled analyses:

1. **Return survival/hazard table** -- for elapsed-time thresholds T (5m,
   10m, 15m, 30m, 1h, 2h, 4h, 8h, 24h): of all gaps (realized + censored)
   that reached at least T, what fraction are known-realized returns vs.
   still-censored/unresolved, and -- for the realized ones -- the median
   *additional* wait beyond T until the actual return.
2. **Gap-START heatmap** (7x24, local time, pooled) -- when the user steps
   away.
3. **Return heatmap** (7x24, local time, pooled) -- when the user comes
   back, plus the single busiest step-away hour vs. busiest return hour.
4. **Gap-length histogram**, log-scale buckets from 0-2m up to 7d+, to
   look for natural clusters (coffee break / lunch / overnight / multi-
   day).
5. **Abandonment by length bucket** -- realized-return counts per length
   bucket, with the total censored count reported alongside as context
   (censored gaps have unknown final length, so they cannot themselves be
   placed in a length bucket).
6. **Cross-session concurrency** -- per day, the max number of distinct
   sessions with turns inside the same local hour; a rough project-
   juggling signal, not proof of literal simultaneous attention.

### Timezone handling

Identical approach to `return_patterns.py`: UTC in the source data,
converted to local time (system local tz by default, `--tz <IANA name>`
override) before any day/hour bucketing. Resolved zone is always printed.

## CLI

```bash
python3 gap_patterns.py --in /path/to/cache_scan_data.jsonl \
    --return-threshold-min 30 \
    --tz Asia/Jerusalem \
    --json /tmp/gap_patterns_out.json
```

- `--in PATH` (required) -- scan JSONL from `cache_scan.py`.
- `--return-threshold-min N` -- gap minutes above which a *realized* gap
  is additionally flagged as a "RETURN event" in the summary line
  (default 30). The survival table itself uses the full elapsed-time
  threshold list (5m..24h), independent of this flag.
- `--tz NAME` -- override local timezone (default: system local tz).
- `--json OUT` -- write the full pooled result object as one JSON file
  (survival table, histogram, abandonment table, concurrency, both
  heatmaps).
- Default (no `--json`): prints the full readable report -- summary
  counts, survival/hazard table, both ASCII heatmaps, gap-length
  histogram, abandonment-by-bucket table, concurrency summary, and a
  plain-English "actionable read" section.

## Honesty / limitations

- **Right-censoring is central, not a footnote.** This is a snapshot: a
  session whose last turn is 20 minutes before the scan is
  indistinguishable, from the file alone, between "about to return" and
  "abandoned." Every session's trailing idle is counted as censored
  regardless of how recent it is -- the tool does not peek at wall-clock
  "now" to decide it's "probably still open." Because of this, the
  `frac_censored_of_reached` numbers for the most recent/longest
  thresholds are an *upper bound* on true abandonment -- some of those
  censored gaps may, in reality, resolve into returns outside this data
  window (the hard right edge of the data is the scan time).
- **History is a weak predictor of any one future gap.** These are
  population tendencies across thousands of past gaps, not a promise
  about what happens after your next coffee break.
- Histogram/heatmap cells with <~20 events may be noise; counts are
  always shown alongside rates so this is visible, not hidden.
- Timezone is a present-day snapshot (same caveat as `return_patterns.py`
  -- travel and historical zone changes are not modeled per-era).
- Concurrency is a rough same-hour co-occurrence count across sessions,
  not proof of literal simultaneous attention.
- **Data-quality anomaly found on this machine's real data, worth
  knowing about for any downstream use:** one day (2026-03-28) shows
  ~6,100 distinct sessions each with a turn concentrated into two single
  UTC hours (10:00 and 17:00), producing an absurd "3096 concurrent
  sessions" reading in the concurrency table -- almost certainly a bulk
  import/migration event that stamped many old session files with
  similar timestamps that day, not real simultaneous usage.
  `gap_patterns.py` flags any day with >100 same-hour concurrent sessions
  inline in the report as a likely artifact rather than silently
  reporting it as normal. This did not meaningfully distort the survival
  table, gap histogram, or heatmaps (those are keyed on gap length /
  hour-of-day, not concurrency), but it does mean analysis 6's numbers
  should be read with that one day excluded/discounted.

## Real output (2026-08-22 run against this machine's `~/.claude/projects`, pooled)

184,242 turn-rows, 6,895 sessions, 177,267 realized gaps, 6,895 censored
trailing idles. Local timezone resolved as `IDT`.

```
1) RETURN SURVIVAL / HAZARD TABLE
      T |     n>=T |  realized>=T |  censored |  frac censored |   median add. wait |  p75 add. wait
     5m |    23330 |        16435 |      6895 |          29.6% |                 8m |            24m
    10m |    16627 |         9732 |      6895 |          41.5% |                13m |            20m
    15m |    13294 |         6399 |      6895 |          51.9% |                15m |            45m
    30m |     9508 |         2613 |      6895 |          72.5% |                51m |           3.8h
   1.0h |     8460 |         1565 |      6895 |          81.5% |               2.2h |           8.5h
   2.0h |     8025 |         1130 |      6895 |          85.9% |               3.3h |          11.4h
   4.0h |     7583 |          688 |      6895 |          90.9% |               6.9h |          19.9h
   8.0h |     7344 |          449 |      6895 |          93.9% |               9.9h |           1.1d
   1.0d |     7060 |          165 |      6895 |          97.7% |              23.8h |           2.7d
```

```
4) GAP-LENGTH HISTOGRAM (realized gaps only)
         0m-2m: 154766  ##################################################
         2m-5m:   6066  ##
        5m-10m:   6703  ##
       10m-15m:   3333  #
       15m-20m:   1324
       20m-30m:   2462  #
       30m-45m:    658
      45m-1.0h:    390
     1.0h-1.5h:    312
     1.5h-2.0h:    123
     2.0h-3.0h:    328
     3.0h-4.0h:    114
     4.0h-6.0h:    161
     6.0h-8.0h:     78
    8.0h-12.0h:    135
   12.0h-18.0h:     93
    18.0h-1.0d:     56
     1.0d-1.5d:     59
     1.5d-2.0d:     24
     2.0d-3.0d:     30
     3.0d-7.0d:     34
      7.0d-inf:     18
```

No sharp multimodal clusters ("coffee break"/"lunch"/"overnight" bumps)
stand out from a smooth decay -- the histogram is dominated (87%) by
sub-2-minute gaps (normal turn-taking), and everything past ~20 minutes
decays roughly monotonically with no distinct secondary peak. Weak, noisy
bumps sit around 2-4h and 8-12h but at n=100-300 each they are not strong
evidence of a real "lunch" or "overnight" habit -- just the long tail of a
skewed distribution.

Gap-start and return heatmaps pooled globally both show 09:00 local as
the single busiest hour (for both stepping away and coming back), with
Saturday the busiest day overall -- consistent with the `investor`
project's own top-5 windows skewing Fri/Sat/Sun in the per-project
report above. No strong "step away evening, return next morning" rhythm
is visible pooled across all work; the vast majority of gaps (87%,
0-2min) are just normal turn-taking, not step-away/return cycles, so the
day/hour heatmaps are dominated by *when the user is generally working*
more than by any distinct return ritual.

### The single clearest actionable finding

**There is no clean elapsed-time cutoff where warming reliably "pays
off," but the data does show a fast decay: by ~15 minutes idle, the
population is already split roughly 50/50 between "about to come back
within another ~15 minutes" and "gone, unresolved in this data." Past 30
minutes idle, roughly 3 in 4 comparable historical gaps never resolved
into an observed return at all** (the 72.5% censored figure at T=30m).
Practically: warming makes the most sense in the first ~10-15 minutes of
an idle window (where the majority of gaps that reach that point do
still resolve, with a short median additional wait of 8-15 minutes); past
30 minutes, most of the historical population is either abandoned or,
if it does return, takes hours -- so continuous warming past that point
is a poor bet. This roughly matches the existing 30-minute active-TTL
default already used elsewhere in this tool suite, which this analysis
is broadly consistent with rather than contradicting.
