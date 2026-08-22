# cache_scan.py

Standalone, read-only Python 3 CLI that scans Claude Code session
transcripts and extracts raw per-turn token/cache/timing data — the raw
material needed to (a) calculate prompt-cache cost and (b) forecast cost
for keep-warm calibration. Single file, standard library only, no pip
dependencies. Runs anywhere Python 3.9+ is installed.

## What it does

Claude Code writes one JSONL file per session under
`~/.claude/projects/<project-slug>/<session-id>.jsonl`. Each line is a
JSON record; assistant turns carry token usage under `message.usage`.

`cache_scan.py` walks every session file, pulls out each assistant
turn's usage numbers, sorts turns within a session by timestamp,
computes the gap since the previous turn, and flags turns where a cache
write happened after the active TTL had already expired with no cache
read (`cache_miss_after_gap`) — i.e. a cold rebuild a warm-keeper would
have avoided.

It never reads message/prompt/tool-output TEXT. Only numeric usage
fields, timestamps, model names, and ids are touched or emitted.

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
| `--summary` | Print per-session (top 20 by cache-creation volume) and grand totals to stdout. Runs by default if neither `--out` nor `--csv` is given. |

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
