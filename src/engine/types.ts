// types.ts - the engine's shared type vocabulary, from SIMULATOR_SPEC.md 5.1.

export type Model = "sonnet" | "opus" | "fable";
export type Tier = "read" | "input" | "w5m" | "w1h" | "output";
export type WriteTier = "5m" | "1h";
export type Who = "inline" | "subagent";
export type PromptStrategy = "identical" | "pointer" | "varied";
export type Hook = "none" | "static" | "dynamic";
export type SkillsMode = "eager" | "invoke";
export type Width = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

// The settings panel, serializable (Section 5.1 / Section 8).
export interface Config {
  orchestratorModel: Model;
  planModel: Model;
  devModel: Model;
  who: Who;
  prompts: PromptStrategy;
  width: Width;
  oneHourFlag: boolean;
  keepWarm: boolean;
  keepWarmMin: number; // 10..55
  hook: Hook;
  skills: number; // 10..150
  skillsMode: SkillsMode;
  memoryFiles: number; // 0..10
  mcp: [boolean, boolean, boolean, boolean];
}

export interface CacheEntry {
  prefixTok: number;
  tier: WriteTier;
  lastTouchMin: number;
  keyId: string;
}

export interface CacheState {
  entries: Record<string, CacheEntry>; // keyId: "main" | "sub:<promptHash>"
}

// A single priced request result (subset of the full LedgerRow in game/types).
export interface RequestRow {
  tMin: number;
  unitId: string | null;
  agent: "main" | "sub";
  model: Model;
  readTok: number;
  inputTok: number;
  writeTok: number;
  writeTier: WriteTier;
  outTok: number;
  usd: number;
}

export interface SimRequest {
  agent: "main" | "sub";
  promptHash: string;
  model: Model;
  workIn: number;
  outTok: number;
  nowMin: number;
  unitId?: string;
}

// ---- Fan-out run shapes (computeRun) ----
export type SegRole = "read" | "write";
export type SegKind = "prefix" | "tail" | "work" | "base" | "varied";

export interface RunSeg {
  tok: number;
  rate: number;
  role: SegRole;
  kind: SegKind;
}

export interface RunTask {
  index: number;
  segs: RunSeg[];
  inTok: number;
  outTok: number;
  cost: number;
  cum: number;
}

export interface RunBreakdown {
  work: number;
  output: number;
  baseWrite: number;
  baseRead: number;
  variedWrite: number;
  variedRead: number;
  inlineRead: number;
  inlineWrite: number;
  coldBases: number;
  warmReads: number;
}

export interface RunResult {
  tasks: RunTask[];
  total: number;
  shipped: boolean;
  diedAt: number | null;
  breakdown: RunBreakdown;
}

// Minimal cfg shape computeRun needs (a subset of Config, kept loose so the
// fan-out prototype's call sites stay byte-identical).
export interface RunCfg {
  model: Model;
  who: Who;
  prompts: PromptStrategy;
  width: number;
}

export interface PriceRow {
  input: number;
  read: number;
  write5m: number;
  write1h: number;
  output: number;
}
