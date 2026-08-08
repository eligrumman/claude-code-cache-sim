// shell.ts - GAME_PLAN.md Section B: the game screen state machine. Pure
// functions over a Screen + CampaignState; no DOM, no engine mutation. The
// shell never mutates GameState directly - it only calls into levels.ts /
// step.ts (initGame, runScript, completeLevel) which already own that.

import type { LevelId, ToolId } from "./levels.js";
import { newCampaign, type CampaignState } from "./levels.js";
import type { GameState } from "./types.js";

export type Screen =
  | { id: "map" }
  | { id: "learn"; level: LevelId }
  | { id: "play"; level: LevelId }
  | { id: "result"; level: LevelId; outcome: LevelOutcome }
  | { id: "freeplay"; toolset: ToolId[] };

export interface LevelOutcome {
  pass: boolean;
  stars: 0 | 1 | 2 | 3;
  reason: string;
  spentUsd: number;
  handCoded: number;
  finalState: GameState;
}

// ---- transitions (Section B.1) - pure, one function per row of the table ----

export function toMap(): Screen {
  return { id: "map" };
}

export function enterLevel(id: LevelId): Screen {
  return { id: "learn", level: id };
}

export function toPlay(id: LevelId): Screen {
  return { id: "play", level: id };
}

export function toResult(id: LevelId, outcome: LevelOutcome): Screen {
  return { id: "result", level: id, outcome };
}

export function toFreeplay(toolset: ToolId[]): Screen {
  return { id: "freeplay", toolset };
}

export function retryLevel(id: LevelId): Screen {
  return { id: "learn", level: id };
}

// ---- persistence (Section B.2) ----

const STORAGE_KEY = "cc-sim-campaign";
const SAVE_VERSION = 1;

interface SaveEnvelope {
  v: number;
  campaign: CampaignState;
}

export function saveCampaign(campaign: CampaignState): void {
  if (typeof localStorage === "undefined") return;
  try {
    const env: SaveEnvelope = { v: SAVE_VERSION, campaign };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(env));
  } catch {
    // storage full/unavailable - fail silently, campaign stays in-memory
  }
}

// loadCampaign(): corrupt or missing save -> newCampaign() (Section B.2).
export function loadCampaign(): CampaignState {
  if (typeof localStorage === "undefined") return newCampaign();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return newCampaign();
    const parsed = JSON.parse(raw) as Partial<SaveEnvelope>;
    if (!parsed || parsed.v !== SAVE_VERSION || !parsed.campaign) return newCampaign();
    const c = parsed.campaign;
    if (!c.unlocked || !c.levels || !c.currentTier) return newCampaign();
    return c;
  } catch {
    return newCampaign();
  }
}

export function clearCampaign(): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
