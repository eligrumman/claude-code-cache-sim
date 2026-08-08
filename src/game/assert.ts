// assert.ts - the gated boot-time invariant block (Section 10). Runs the same
// checks the mock ran in console.assert form: never breaks the page, logs
// PASSED/FAILED. The vitest suite asserts these same numbers as hard tests.

import { priceTable, RATE } from "../engine/pricing.js";
import { mainBaseTok, subBaseTok } from "../engine/ledgers.js";
import { simulateRequest } from "../engine/simulate.js";
import { DEFAULT_CFG } from "../engine/constants.js";
import { runScript, totalSpent } from "./step.js";
import type { Config } from "../engine/types.js";

const GOOD: Partial<Config> = {
  planModel: "fable", devModel: "sonnet", who: "subagent", prompts: "identical",
  oneHourFlag: false, keepWarm: true, keepWarmMin: 50, hook: "static", skills: 10,
  skillsMode: "invoke", memoryFiles: 0, mcp: [true, false, false, false], width: 8,
};
const BAD: Partial<Config> = {
  planModel: "sonnet", devModel: "fable", who: "inline", prompts: "varied",
  oneHourFlag: false, keepWarm: false, hook: "dynamic", skills: 150, skillsMode: "eager",
  memoryFiles: 10, mcp: [true, true, true, true], width: 8,
};

export function bootAssert(): void {
  try {
    let ok = true;
    const eq = (a: number, b: number, m: string) => {
      if (Math.abs(a - b) > 1e-6) {
        console.assert(false, m + " got " + a + " want " + b);
        ok = false;
      }
    };

    const pS = priceTable("sonnet"), pO = priceTable("opus"), pF = priceTable("fable");
    eq(pS.input, 3, "sonnet in"); eq(pS.read, 0.3, "sonnet read"); eq(pS.output, 15, "sonnet out");
    eq(pO.input, 5, "opus in"); eq(pO.write1h, 10, "opus w1h"); eq(pO.output, 25, "opus out");
    eq(pF.input, 10, "fable in"); eq(pF.write5m, 12.5, "fable w5m"); eq(pF.output, 50, "fable out");

    eq(RATE.w1h / RATE.read, 20, "20x gap");
    eq(mainBaseTok(DEFAULT_CFG), 34738 + 400 * 10, "mainBase default");
    eq(subBaseTok(DEFAULT_CFG), 26237, "subBase = 26237 at defaults");

    const cache = { entries: {} };
    const s1 = simulateRequest(cache, DEFAULT_CFG, { agent: "sub", promptHash: "d", model: "sonnet", workIn: 0, outTok: 0, nowMin: 0 });
    const s2 = simulateRequest(s1.cache, DEFAULT_CFG, { agent: "sub", promptHash: "d", model: "sonnet", workIn: 0, outTok: 0, nowMin: 1 });
    eq(s1.row.writeTok, 26237, "spawn1 write"); eq(s1.row.readTok, 0, "spawn1 read");
    eq(s2.row.writeTok, 0, "spawn2 write"); eq(s2.row.readTok, 26237, "spawn2 read");

    const v = simulateRequest({ entries: {} }, { ...DEFAULT_CFG, prompts: "varied" }, { agent: "sub", promptHash: "x", model: "sonnet", workIn: 0, outTok: 0, nowMin: 0 });
    eq(v.row.readTok, 11602, "varied read"); eq(v.row.writeTok, 14623, "varied write");

    const g = runScript(42, "month", GOOD);
    const bd = runScript(42, "month", BAD);
    const bdGross = runScript(42, "month", BAD, true);
    console.assert(totalSpent(g) < totalSpent(bdGross), "GOOD < BAD gross");
    console.assert(totalSpent(g) >= 48 && totalSpent(g) <= 66, "GOOD in band [48,66], got " + totalSpent(g).toFixed(2));
    console.assert(totalSpent(bdGross) >= 135 && totalSpent(bdGross) <= 195, "BAD gross in band [135,195], got " + totalSpent(bdGross).toFixed(2));
    console.assert(g.counts.handCoded === 0, "GOOD ships 0 hand-coded");
    console.assert(bd.counts.handCoded >= 3, "BAD forces >=3 hand-coded, got " + bd.counts.handCoded);

    console.log(
      "%c[Simulator] boot assertions " + (ok ? "PASSED" : "FAILED"),
      "font-weight:bold;color:" + (ok ? "#2f8f5b" : "#c23b3b"),
    );
    console.log("  GOOD_RUN $" + totalSpent(g).toFixed(2) + " hand-coded " + g.counts.handCoded +
      "  |  BAD_RUN $" + totalSpent(bd).toFixed(2) + " hand-coded " + bd.counts.handCoded);
  } catch (e) {
    console.warn("[Simulator] assertion harness error (page still runs):", e);
  }
}
