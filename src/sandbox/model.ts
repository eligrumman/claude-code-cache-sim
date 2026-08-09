import { MODEL_IN, priceTokens } from "../sim/cost.js";
import type { Model } from "../engine/types.js";
export { simulateMessageLedger } from "../sim/ledger.js";
export type {
  MessageBucket, MessageLedger, MessageLedgerEntry, MessageLedgerOptions, ScriptedMessage, Ttl,
} from "../sim/ledger.js";
import type { Ttl } from "../sim/ledger.js";

export type PersonaId = "developer" | "pm" | "teamLead" | "oneManCompany";
export type ApprovalMode = "manual" | "auto";
export type SubagentPrompt = "same" | "different";
export type BucketId = "input" | "cacheWrite" | "cacheRead" | "output" | "keepWarm";
export type LeverId = "subagents" | "ttl" | "context" | "approval" | "keepWarm" | "model";

export interface SandboxConfig {
  subagents: SubagentPrompt;
  ttl: Ttl;
  context: number;
  approval: ApprovalMode;
  keepWarm: boolean;
  model: Model;
}

export interface PersonaProfile {
  id: PersonaId;
  emoji: string;
  name: string;
  description: string;
  sessions: number;
  requestsPerSession: number;
  basePrefixTok: number;
  workInTok: number;
  outputTok: number;
  subagentsPerSession: number;
  /** Gap before each session, in minutes from the previous touch. First entry is ignored. */
  sessionGapsMin: number[];
  /** Natural gaps between requests, repeated as needed. */
  requestGapsMin: number[];
  defaults: SandboxConfig;
}

export interface CostSegment {
  id: string;
  session: number;
  request: number;
  bucket: BucketId;
  tokens: number;
  usd: number;
  atMin: number;
  label: string;
  why: string;
  cold?: boolean;
  subagent?: boolean;
}

export interface SessionResult {
  index: number;
  startMin: number;
  endMin: number;
  segments: CostSegment[];
}

export interface DayResult {
  persona: PersonaProfile;
  config: SandboxConfig;
  prefixTok: number;
  sessions: SessionResult[];
  segments: CostSegment[];
  buckets: Record<BucketId, { tokens: number; usd: number }>;
  totalUsd: number;
  warmPrefixTok: number;
  rebuiltPrefixTok: number;
  cacheHealthPct: number;
  dayLengthMin: number;
}

const base = {
  model: "sonnet" as Model,
  context: 1,
};

export const PERSONAS: Record<PersonaId, PersonaProfile> = {
  developer: {
    id: "developer", emoji: "👩‍💻", name: "Developer",
    description: "Four focused coding bursts, with approvals and helper agents.",
    sessions: 4, requestsPerSession: 8, basePrefixTok: 20_000, workInTok: 520, outputTok: 720,
    subagentsPerSession: 2, sessionGapsMin: [0, 42, 95, 36], requestGapsMin: [2, 3, 2, 4, 2, 3, 2],
    defaults: { ...base, subagents: "same", ttl: "5m", approval: "auto", keepWarm: false },
  },
  pm: {
    id: "pm", emoji: "📋", name: "PM",
    description: "Two planning sessions punctuated by meetings and long pauses.",
    sessions: 2, requestsPerSession: 5, basePrefixTok: 6_000, workInTok: 380, outputTok: 500,
    subagentsPerSession: 1, sessionGapsMin: [0, 185], requestGapsMin: [12, 38, 18, 52],
    defaults: { ...base, subagents: "same", ttl: "1h", approval: "manual", keepWarm: false },
  },
  teamLead: {
    id: "teamLead", emoji: "🧭", name: "Team Lead",
    description: "Large review context, medium pauses, one delegated check per session.",
    sessions: 3, requestsPerSession: 6, basePrefixTok: 40_000, workInTok: 650, outputTok: 850,
    subagentsPerSession: 1, sessionGapsMin: [0, 78, 112], requestGapsMin: [4, 8, 12, 5, 16],
    defaults: { ...base, subagents: "different", ttl: "1h", approval: "auto", keepWarm: false },
  },
  oneManCompany: {
    id: "oneManCompany", emoji: "🚀", name: "One-Man Company",
    description: "A long, agent-heavy day hopping between product, code, and sales.",
    sessions: 6, requestsPerSession: 10, basePrefixTok: 35_000, workInTok: 580, outputTok: 800,
    subagentsPerSession: 3, sessionGapsMin: [0, 55, 130, 46, 165, 72], requestGapsMin: [2, 4, 7, 3, 15, 2, 8, 3, 20],
    defaults: { ...base, subagents: "same", ttl: "5m", approval: "manual", keepWarm: true },
  },
};

export const BUCKET_META: Record<BucketId, { label: string; why: string }> = {
  input: { label: "Fresh input", why: "The new instructions typed for this request." },
  cacheWrite: { label: "Cache rebuild", why: "The prefix was cold (or unique), so it had to be written again." },
  cacheRead: { label: "Warm cache read", why: "The prefix survived and was reused at the 0.1× read rate." },
  output: { label: "Output", why: "Claude's generated tokens are billed at the 5× output rate." },
  keepWarm: { label: "Keep-warm ping", why: "A cheap read resets the TTL before the prefix expires." },
};

export function bucketCost(tokens: number, bucket: BucketId, config: SandboxConfig): number {
  return priceTokens(tokens, bucket, config);
}

function emptyBuckets(): DayResult["buckets"] {
  return {
    input: { tokens: 0, usd: 0 }, cacheWrite: { tokens: 0, usd: 0 },
    cacheRead: { tokens: 0, usd: 0 }, output: { tokens: 0, usd: 0 },
    keepWarm: { tokens: 0, usd: 0 },
  };
}

/** Deterministic, pure day simulation. Every touch uses the strict gap < TTL rule. */
export function simulateDay(persona: PersonaId | PersonaProfile, config: SandboxConfig): DayResult {
  const profile = typeof persona === "string" ? PERSONAS[persona] : persona;
  const prefixTok = Math.round(profile.basePrefixTok * config.context);
  const ttlMin = config.ttl === "5m" ? 5 : 60;
  const pingEvery = Math.max(1, ttlMin - 1);
  const buckets = emptyBuckets();
  const segments: CostSegment[] = [];
  const sessions: SessionResult[] = [];
  let clock = 9 * 60;
  let lastTouch = Number.NEGATIVE_INFINITY;
  let warmPrefixTok = 0;
  let rebuiltPrefixTok = 0;
  let serial = 0;

  const add = (session: number, request: number, bucket: BucketId, tokens: number, atMin: number,
    extra: Partial<CostSegment> = {}) => {
    const meta = BUCKET_META[bucket];
    const segment: CostSegment = {
      id: `${session}-${request}-${serial++}`, session, request, bucket, tokens, atMin,
      usd: bucketCost(tokens, bucket, config), label: meta.label, why: meta.why, ...extra,
    };
    buckets[bucket].tokens += tokens;
    buckets[bucket].usd += segment.usd;
    segments.push(segment);
    return segment;
  };

  const crossGap = (gap: number, session: number) => {
    const target = Number.isFinite(lastTouch) ? Math.max(clock, lastTouch + gap) : clock + gap;
    if (config.keepWarm && Number.isFinite(lastTouch) && target - lastTouch >= ttlMin) {
      // Ping immediately before each expiry. For extremely long gaps, repeated reads can
      // cost more than accepting one rebuild: that break-even is intentionally visible.
      while (lastTouch + pingEvery < target) {
        add(session, -1, "keepWarm", prefixTok, lastTouch + pingEvery);
        lastTouch += pingEvery;
      }
    }
    clock = target;
  };

  for (let s = 0; s < profile.sessions; s += 1) {
    if (s > 0) crossGap(profile.sessionGapsMin[s] ?? profile.sessionGapsMin[profile.sessionGapsMin.length - 1] ?? 60, s);
    const sessionStart = clock;
    const sessionSegmentsStart = segments.length;
    let subagentSpawnsLeft = profile.subagentsPerSession;
    let subagentWritten = false;

    for (let r = 0; r < profile.requestsPerSession; r += 1) {
      if (r > 0) {
        const naturalGap = profile.requestGapsMin[(r - 1) % profile.requestGapsMin.length] ?? 2;
        crossGap(naturalGap + (config.approval === "manual" ? 6 : 0), s);
      }
      const live = clock - lastTouch < ttlMin;
      const prefixBucket: BucketId = live ? "cacheRead" : "cacheWrite";
      add(s, r, prefixBucket, prefixTok, clock, { cold: !live });
      if (live) warmPrefixTok += prefixTok;
      else rebuiltPrefixTok += prefixTok;
      add(s, r, "input", profile.workInTok, clock);
      add(s, r, "output", profile.outputTok, clock);
      lastTouch = clock;

      // Spread a persona's N helper-agent spawns across the early requests in a session.
      if (subagentSpawnsLeft > 0 && r < profile.subagentsPerSession) {
        const reuse = config.subagents === "same" && subagentWritten;
        add(s, r, reuse ? "cacheRead" : "cacheWrite", prefixTok, clock + 0.1, {
          cold: !reuse, subagent: true,
          label: reuse ? "Reused subagent prompt" : "Subagent prompt write",
          why: reuse ? "Same helper prompt, so later spawns reuse the cached prefix."
            : config.subagents === "different"
              ? "A different helper prompt cannot reuse the previous cached prefix."
              : "The first helper spawn writes this session's shared prompt once.",
        });
        if (reuse) warmPrefixTok += prefixTok;
        else rebuiltPrefixTok += prefixTok;
        subagentWritten = true;
        subagentSpawnsLeft -= 1;
      }
      clock += 1;
    }
    sessions.push({
      index: s, startMin: sessionStart, endMin: clock,
      segments: segments.slice(sessionSegmentsStart),
    });
  }

  const totalUsd = Object.values(buckets).reduce((sum, bucket) => sum + bucket.usd, 0);
  const cacheTotal = warmPrefixTok + rebuiltPrefixTok;
  return {
    persona: profile, config: { ...config }, prefixTok, sessions, segments, buckets, totalUsd,
    warmPrefixTok, rebuiltPrefixTok,
    cacheHealthPct: cacheTotal ? (warmPrefixTok / cacheTotal) * 100 : 0,
    dayLengthMin: Math.max(1, clock - 9 * 60),
  };
}

export function configForLever(baseConfig: SandboxConfig, lever: LeverId, useAlternative: boolean): SandboxConfig {
  if (!useAlternative) return { ...baseConfig };
  const next = { ...baseConfig };
  if (lever === "subagents") next.subagents = next.subagents === "same" ? "different" : "same";
  if (lever === "ttl") next.ttl = next.ttl === "5m" ? "1h" : "5m";
  if (lever === "context") next.context = next.context <= 1 ? 1.75 : 0.65;
  if (lever === "approval") next.approval = next.approval === "manual" ? "auto" : "manual";
  if (lever === "keepWarm") next.keepWarm = !next.keepWarm;
  if (lever === "model") next.model = next.model === "sonnet" ? "opus" : "sonnet";
  return next;
}

export function formatModelRate(model: Model): string {
  return `$${MODEL_IN[model]}/M input tokens`;
}
