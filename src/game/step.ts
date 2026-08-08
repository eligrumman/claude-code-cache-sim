// game/step.ts - the pure reducer over the SDLC unit graph (Section 5.3) and the
// deterministic replay driver (Section 5.5). Typed signatures are wired now; the
// full pipeline (clock, cache expiry, PRNG rework, win/lose) lands next phase.
// Uses immer so each transition is a pure structural update of GameState.

import { produce } from "immer";
import type { Action, GameState, SaveFile } from "./types.js";

// step(state, action) -> next state (pure). SIMULATOR_SPEC.md Section 5.3.
// TODO(next phase): RUN_UNIT pipeline (advance clock, expire cache, simulateRequest
// per emitted request, debit wallet, accrue hidden buckets, roll rework via PRNG),
// HAND_CODE (manualHours/tedium), IDLE_RESOLVE, SET_CFG, end-condition checks.
export function step(state: GameState, action: Action): GameState {
  return produce(state, (draft) => {
    switch (action.type) {
      case "SET_CFG":
        // Config edits allowed between units only (Section 5.3). Full guard next phase.
        Object.assign(draft.cfg, action.patch);
        break;
      case "RUN_UNIT":
      case "HAND_CODE":
      case "IDLE_RESOLVE":
      case "TICK_REPLAY":
        // stub - see ARCHITECTURE.md / SIMULATOR_SPEC.md Section 5.3
        break;
      default: {
        // exhaustiveness guard: a new Action variant must be handled here.
        const _never: never = action;
        return _never;
      }
    }
  });
}

// replay(save, init) -> final state. Deterministic given (seed, actions) alone
// (invariant 8: two replays => identical ledger hash).
export function replay(save: SaveFile, init: (seed: number, mode: SaveFile["mode"]) => GameState): GameState {
  let state = init(save.seed, save.mode);
  for (const action of save.actions) state = step(state, action);
  return state;
}
