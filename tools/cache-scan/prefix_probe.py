#!/usr/bin/env python3
"""
prefix_probe.py -- READ-ONLY prototype.

Reads a Claude Code session JSONL transcript and attempts to reconstruct the
message-history portion of the Anthropic Messages API request body that the
live session would send on its NEXT turn, for the purpose of evaluating
whether a `max_tokens: 0` warm-up replay could hit the same prompt cache
entry as the real session.

This script NEVER sends a network request. It only reads the transcript and
prints a report: what was recovered, a rough token estimate, and an explicit
list of gaps that make byte-identical reconstruction impossible from the
transcript alone.
"""

import argparse
import json
import sys
from pathlib import Path


def load_records(path: Path):
    records = []
    with path.open("r", encoding="utf-8", errors="replace") as f:
        for lineno, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue
            try:
                records.append(json.loads(line))
            except json.JSONDecodeError as e:
                records.append({"_parse_error": str(e), "_lineno": lineno})
    return records


def char_len_of_content(content):
    """Rough char count of an API 'content' field (str or list of blocks)."""
    if content is None:
        return 0
    if isinstance(content, str):
        return len(content)
    if isinstance(content, list):
        total = 0
        for block in content:
            if not isinstance(block, dict):
                total += len(str(block))
                continue
            btype = block.get("type")
            if btype == "text":
                total += len(block.get("text", ""))
            elif btype == "thinking":
                total += len(block.get("thinking", "")) + len(block.get("signature", ""))
            elif btype == "tool_use":
                total += len(json.dumps(block.get("input", {})))
                total += len(block.get("name", ""))
            elif btype == "tool_result":
                c = block.get("content")
                if isinstance(c, str):
                    total += len(c)
                elif isinstance(c, list):
                    for sub in c:
                        if isinstance(sub, dict) and sub.get("type") == "text":
                            total += len(sub.get("text", ""))
                        else:
                            total += len(str(sub))
                else:
                    total += len(str(c))
            else:
                total += len(json.dumps(block))
        return total
    return len(str(content))


def reconstruct(records):
    """
    Reconstruct the linear message list in Anthropic API format, following
    parentUuid chains where present, else falling back to file order.
    Only 'user' and 'assistant' typed records carry API messages; everything
    else (system/hook/meta/attachment/etc.) is transcript-only bookkeeping
    that has NO place in the API request body (but may still have influenced
    what got injected INTO a user turn as text, which we cannot recover
    independently of what's already inlined in message.content).
    """
    api_messages = []
    recovered_blocks = 0
    skipped_sidechain = 0
    thinking_with_sig = 0
    thinking_without_sig = 0
    tool_use_count = 0
    tool_result_count = 0
    non_api_record_types = {}
    total_chars = 0

    for rec in records:
        rtype = rec.get("type")
        if rtype not in ("user", "assistant"):
            non_api_record_types[rtype] = non_api_record_types.get(rtype, 0) + 1
            continue

        if rec.get("isSidechain"):
            # Sub-agent / side conversation, not part of the main-session
            # linear prefix. Excluded from the reconstructed main thread.
            skipped_sidechain += 1
            continue

        msg = rec.get("message")
        if not isinstance(msg, dict):
            continue
        role = msg.get("role")
        content = msg.get("content")

        if isinstance(content, list):
            for block in content:
                if not isinstance(block, dict):
                    continue
                bt = block.get("type")
                if bt == "thinking":
                    if block.get("signature"):
                        thinking_with_sig += 1
                    else:
                        thinking_without_sig += 1
                elif bt == "tool_use":
                    tool_use_count += 1
                elif bt == "tool_result":
                    tool_result_count += 1
            recovered_blocks += len(content)
        elif isinstance(content, str):
            recovered_blocks += 1

        total_chars += char_len_of_content(content)

        api_messages.append({"role": role, "content": content})

    return {
        "api_messages": api_messages,
        "recovered_blocks": recovered_blocks,
        "skipped_sidechain_records": skipped_sidechain,
        "thinking_blocks_with_signature": thinking_with_sig,
        "thinking_blocks_without_signature": thinking_without_sig,
        "tool_use_blocks": tool_use_count,
        "tool_result_blocks": tool_result_count,
        "non_api_record_types": non_api_record_types,
        "total_chars": total_chars,
    }


GAPS = [
    "SYSTEM PROMPT: not present in the transcript at all. The compiled claude "
    "binary contains the system-prompt TEMPLATE (verified via string scan: "
    "'You are Claude Code', '<env>', \"Today's date is\", gitStatus block) but "
    "the actual bytes sent are assembled at runtime with dynamic values (date, "
    "cwd, git branch/status, model id, permission mode, plugin/skill listing, "
    "possibly A/B'd prompt variants across CLI versions). Cannot be reproduced "
    "byte-exact from JSONL; would have to be regenerated by literally running "
    "the same CLI version's prompt-assembly code with matching runtime state.",

    "TOOL DEFINITIONS (name/description/JSON-schema for every tool incl. MCP "
    "tools): the transcript only records tool_use CALLS (name + input actually "
    "invoked) and tool_result outputs, never the tool's registered schema. "
    "The full tool list sent on every turn (Bash, Read, Edit, Grep, Glob, Task, "
    "WebFetch, plus whatever MCP servers are connected) lives in the running "
    "CLI process / MCP handshake, not in JSONL.",

    "MCP TOOL LIST composition varies run-to-run based on which MCP servers "
    "happen to be connected/healthy at process start -- not deterministic from "
    "transcript history.",

    "DYNAMIC PER-TURN INJECTIONS: ephemeral <system-reminder> blocks (deferred "
    "tool listings, skill listings, date-change notices, memory/context "
    "reminders) are appended by the harness around user turns. Some of these "
    "ARE inlined into message.content in the JSONL (so partially recoverable), "
    "but others (e.g. tool-availability reminders keyed off runtime state) can "
    "differ between what was recorded and what will be sent on the NEXT turn, "
    "since the next turn hasn't happened yet -- there is nothing in the JSONL "
    "to reconstruct for a turn that doesn't exist yet.",

    "THINKING BLOCK SIGNATURES: extended-thinking blocks carry an opaque "
    "'signature' field cryptographically tied to that exact generation. These "
    "ARE captured verbatim in JSONL when present, which is good -- but any "
    "record with thinking-without-signature, or any place the harness strips/ "
    "rewrites thinking on resume, breaks byte-identity.",

    "SUBAGENT / SIDECHAIN TURNS: isSidechain=true records (subagent "
    "transcripts) are stored in separate files under <session>/subagents/*.jsonl "
    "and are not part of the main session's linear prefix; whether/how the "
    "harness folds their results into the parent thread's cached prefix is an "
    "implementation detail not observable from the parent JSONL alone.",

    "TOOL_RESULT CONTENT for non-text results (images, structured JSON with "
    "harness-specific normalization, truncation markers like '[X lines "
    "truncated]') may not match byte-for-byte what was actually sent to the "
    "API if the CLI post-processes large outputs differently between the live "
    "run and a reconstructed replay.",

    "REQUEST-LEVEL METADATA outside 'messages': anthropic-beta headers, "
    "model id aliasing, cache_control breakpoint placement rules, "
    "service_tier, interleaved-thinking flags -- none of these are recorded "
    "per-message in JSONL; they are CLI-version-specific request-building "
    "logic.",

    "CACHE_CONTROL BREAKPOINT LOCATION: usage.cache_creation_input_tokens "
    "seen on resume turns (tens of thousands of tokens, not just a few "
    "hundred for a static system+tools head) implies Claude Code places its "
    "breakpoint near the END of the growing conversation, i.e. it caches the "
    "WHOLE prefix including full message history, not just a static head. "
    "This means the reconstruction bar is 'entire conversation, byte-exact', "
    "not merely 'system prompt + tool defs'.",
]


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("jsonl_path", type=Path, help="Path to a session .jsonl transcript")
    ap.add_argument("--dump-last-n", type=int, default=0,
                     help="Print the last N reconstructed API messages (role + first 200 chars)")
    args = ap.parse_args()

    if not args.jsonl_path.exists():
        print(f"ERROR: {args.jsonl_path} does not exist", file=sys.stderr)
        sys.exit(1)

    print(f"[READ-ONLY] Loading transcript: {args.jsonl_path}")
    records = load_records(args.jsonl_path)
    print(f"Total JSONL records: {len(records)}")

    result = reconstruct(records)

    est_tokens = result["total_chars"] // 4

    print()
    print("=== RECONSTRUCTION REPORT (message-history portion only) ===")
    print(f"API messages recovered (user+assistant, main chain): {len(result['api_messages'])}")
    print(f"Content blocks recovered (text/thinking/tool_use/tool_result): {result['recovered_blocks']}")
    print(f"  thinking blocks WITH signature:    {result['thinking_blocks_with_signature']}")
    print(f"  thinking blocks WITHOUT signature: {result['thinking_blocks_without_signature']}")
    print(f"  tool_use blocks:                   {result['tool_use_blocks']}")
    print(f"  tool_result blocks:                {result['tool_result_blocks']}")
    print(f"Sidechain (subagent) records excluded from main chain: {result['skipped_sidechain_records']}")
    print(f"Non-API record types seen (bookkeeping, not sent to API): {result['non_api_record_types']}")
    print()
    print(f"Rough char count of recovered message content: {result['total_chars']:,}")
    print(f"Rough token estimate (chars/4): {est_tokens:,} tokens")
    print()
    print("=== GAPS THIS SCRIPT CANNOT FILL (byte-identity blockers) ===")
    for i, g in enumerate(GAPS, 1):
        print(f"{i}. {g}")
        print()

    if args.dump_last_n:
        print(f"=== last {args.dump_last_n} reconstructed messages (truncated) ===")
        for m in result["api_messages"][-args.dump_last_n:]:
            c = m["content"]
            if isinstance(c, list):
                preview = " | ".join(
                    f"[{b.get('type')}]" for b in c if isinstance(b, dict)
                )
            else:
                preview = (c or "")[:200].replace("\n", "\\n")
            print(f"- {m['role']}: {preview}")


if __name__ == "__main__":
    main()
