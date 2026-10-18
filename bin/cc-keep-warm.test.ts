// @vitest-environment node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { economics, parseTurns, pickTestSession, ping, plan, report, runOnce, summarize, verify } from "./cc-keep-warm.mjs";

const MIN = 60_000;
const T0 = Date.parse("2026-10-17T12:00:00Z");

function turn(at: number, usage: Record<string, unknown>, extra: Record<string, unknown> = {}) {
  return JSON.stringify({
    type: "assistant",
    sessionId: "s1",
    cwd: "/work",
    timestamp: new Date(at).toISOString(),
    message: { model: "claude-opus-5-5", usage },
    ...extra,
  });
}

const warmTurn = (at: number) => turn(at, { input_tokens: 2, cache_read_input_tokens: 99_000, cache_creation_input_tokens: 998, cache_creation: { ephemeral_1h_input_tokens: 998, ephemeral_5m_input_tokens: 0 } });
const session = { sessionId: "s1", model: "claude-opus-5-5", cwd: "/work", lastActivity: T0, prefix: 100_000, ttl: "1h" };

describe("economics", () => {
  it("prices a rebuild at 40 reads on Opus 5.5 with the 1h TTL", () => {
    const e = economics(100_000, "claude-opus-5-5", "1h");
    expect(e.rebuild).toBeCloseTo(0.8);
    expect(e.ping).toBeCloseTo(0.02);
    expect(e.maxPings).toBe(39);
  });

  it("uses the cheaper Fable 5.1 cache read", () => {
    expect(economics(100_000, "claude-fable-5-1", "1h").maxPings).toBe(79);
  });
});

describe("transcript parsing", () => {
  it("keeps main-thread turns and reads the TTL from the last cache write", () => {
    const turns = parseTurns([
      warmTurn(T0 - 10 * MIN),
      turn(T0, { input_tokens: 1, cache_read_input_tokens: 5 }, { isSidechain: true }),
      "not json",
      JSON.stringify({ type: "user", timestamp: new Date(T0).toISOString() }),
    ]);
    expect(turns).toHaveLength(1);
    expect(summarize(turns)).toMatchObject({ sessionId: "s1", prefix: 100_000, ttl: "1h", lastActivity: T0 - 10 * MIN });
  });

  it("detects 5-minute sessions", () => {
    const turns = parseTurns([turn(T0, { input_tokens: 0, cache_read_input_tokens: 0, cache_creation_input_tokens: 500, cache_creation: { ephemeral_5m_input_tokens: 500 } })]);
    expect(summarize(turns)?.ttl).toBe("5m");
  });
});

describe("plan", () => {
  const hours = 8 * 60 * MIN;
  it("waits while the cache is comfortably warm", () => {
    expect(plan(session, undefined, T0 + 30 * MIN, hours).action).toBe("wait");
  });

  it("pings just before the TTL runs out", () => {
    expect(plan(session, undefined, T0 + 55 * MIN, hours).action).toBe("ping");
  });

  it("measures the next deadline from the last ping, not the last message", () => {
    const record = { since: T0, pings: [{ at: T0 + 55 * MIN }] };
    expect(plan(session, record, T0 + 70 * MIN, hours).action).toBe("wait");
    expect(plan(session, record, T0 + 108 * MIN, hours).action).toBe("ping");
  });

  it("never pings an already-expired cache (that would just pay for the rebuild)", () => {
    expect(plan(session, undefined, T0 + 61 * MIN, hours)).toMatchObject({ action: "skip", reason: "already cold" });
  });

  it("stops at --max-idle", () => {
    const record = { since: T0, pings: [{ at: T0 + 9 * 60 * MIN }] };
    expect(plan(session, record, T0 + 9 * 60 * MIN + 55 * MIN, hours).reason).toBe("past --max-idle");
  });

  it("stops once more pings would cost more than the rebuild they protect", () => {
    const record = { since: T0, pings: Array.from({ length: 39 }, (_, i) => ({ at: T0 + i })) };
    const late = { ...record, pings: [...record.pings.slice(0, -1), { at: T0 + 100 * MIN }] };
    expect(plan(session, late, T0 + 155 * MIN, 100 * hours).reason).toMatch(/cost more/);
  });
});

describe("verify", () => {
  const record = { since: T0, pings: [{ at: T0 + 55 * MIN, prefix: 100_000, cost: 0.02 }] };
  it("counts a warm return when the next turn reads the prefix", () => {
    expect(verify(record, parseTurns([warmTurn(T0), warmTurn(T0 + 80 * MIN)]))?.warm).toBe(true);
  });

  it("counts a cold return when the next turn rebuilds", () => {
    const cold = turn(T0 + 200 * MIN, { input_tokens: 2, cache_read_input_tokens: 0, cache_creation_input_tokens: 100_000 });
    expect(verify(record, parseTurns([cold]))?.warm).toBe(false);
  });
});

describe("ping", () => {
  it("forks without persisting, uses the session's model, and strips the parent session id", () => {
    process.env.CLAUDE_CODE_SESSION_ID = "parent";
    let seen: { args: string[]; env: Record<string, string> } | undefined;
    const fake = (_bin: string, args: string[], opts: { env: Record<string, string> }) => {
      seen = { args, env: opts.env };
      return { status: 0, stdout: JSON.stringify({ usage: { cache_read_input_tokens: 99_500, cache_creation_input_tokens: 500 }, total_cost_usd: 0.021 }) };
    };
    const result = ping(session, { claude: "claude" }, fake as never);
    delete process.env.CLAUDE_CODE_SESSION_ID;
    expect(seen?.args).toEqual(expect.arrayContaining(["--resume", "s1", "--fork-session", "--no-session-persistence", "--model", "claude-opus-5-5"]));
    expect(seen?.env.CLAUDE_CODE_SESSION_ID).toBeUndefined();
    expect(result).toMatchObject({ ok: true, read: 99_500, cost: 0.021 });
    expect(result.hit).toBeCloseTo(0.995);
  });
});

describe("runOnce end to end", () => {
  it("pings, then books the avoided rebuild when you come back warm", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "kw-"));
    const dir = path.join(root, "projects", "-work");
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, "s1.jsonl");
    fs.writeFileSync(file, `${warmTurn(T0)}\n`);
    const options = { dir: path.join(root, "projects"), state: path.join(root, "state.json"), maxIdleMs: 8 * 60 * MIN, claude: "claude", dryRun: false };
    const pinger = () => ({ ok: true, read: 100_000, write: 300, cost: 0.02, hit: 1 });
    const quiet = () => {};

    runOnce(options, T0 + 55 * MIN, pinger, quiet);
    fs.appendFileSync(file, `${warmTurn(T0 + 90 * MIN)}\n`);
    const state = runOnce(options, T0 + 91 * MIN, pinger, quiet);

    expect(state.ledger).toHaveLength(1);
    expect(state.ledger[0]).toMatchObject({ warm: true, pings: 1 });
    expect(state.ledger[0].avoided).toBeCloseTo(0.78);
    expect(report(state)).toContain("saved");
  });

  it("disables a session whose ping misses the cache", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "kw-"));
    const dir = path.join(root, "projects", "-work");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "s1.jsonl"), `${warmTurn(T0)}\n`);
    const options = { dir: path.join(root, "projects"), state: path.join(root, "state.json"), maxIdleMs: 8 * 60 * MIN, claude: "claude", dryRun: false };
    const state = runOnce(options, T0 + 55 * MIN, () => ({ ok: true, read: 30_000, write: 70_000, cost: 0.5, hit: 0.3 }), () => {});
    expect(state.sessions.s1.disabled).toMatch(/30%/);
    expect(plan(session, state.sessions.s1, T0 + 108 * MIN, 8 * 60 * MIN).action).toBe("skip");
  });
});

describe("runOnce cost guard", () => {
  it("disables a session whose ping costs more than the rebuild it prevents", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "kw-"));
    const dir = path.join(root, "projects", "-work");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "s1.jsonl"), `${warmTurn(T0)}\n`);
    const options = { dir: path.join(root, "projects"), state: path.join(root, "state.json"), maxIdleMs: 8 * 60 * MIN, claude: "claude", dryRun: false };
    const state = runOnce(options, T0 + 55 * MIN, () => ({ ok: true, read: 100_000, write: 100_000, cost: 0.9, hit: 1 }), () => {});
    expect(state.sessions.s1.disabled).toMatch(/more than the/);
  });
});

describe("pickTestSession", () => {
  const old = { ...session, sessionId: "old", lastActivity: T0 - 57 * 60 * MIN };
  const fresh = { ...session, sessionId: "fresh", lastActivity: T0 - 10 * MIN };
  it("skips a newer cold session for an older warm one", () => {
    expect(pickTestSession([old, { ...fresh, lastActivity: T0 - 30 * MIN }], "latest", T0).session?.sessionId).toBe("fresh");
  });

  it("refuses to test when every match is cold, and names the cold one", () => {
    const picked = pickTestSession([old], "latest", T0);
    expect(picked.session).toBeUndefined();
    expect(picked.coldMatch?.sessionId).toBe("old");
  });

  it("honours an explicit session id", () => {
    expect(pickTestSession([old, fresh], "fre", T0).session?.sessionId).toBe("fresh");
    expect(pickTestSession([old, fresh], "old", T0).session).toBeUndefined();
  });
});
