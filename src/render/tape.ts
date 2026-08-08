// tape.ts - Canvas2D Tape renderer. Draws each request on the wire as a
// horizontal bar (blue cache-read segment / red write+input segment), scaled to
// token count, swept left-to-right by a scan head, with the per-request cost
// printed once the sweep passes. DPR-aware, single bounded rAF, and
// prefers-reduced-motion cuts straight to the final frame. Owns no economics -
// it consumes priced LedgerRows and reads theme colors from CSS variables.
// Ported from build/sim-mock.html drawTape/tick/playTape (itself the fan-out
// row renderer) and build/tape-prototype.html resize()/easeInOut.

import { getDpr } from "./dpr.js";
import { easeInOut, reducedMotion } from "./tween.js";
import type { LedgerRow } from "../game/types.js";

const ROW_H = 16;
const ROW_GAP = 8;
const PAD_T = 14;
const PAD_B = 10;
const GUTTER = 64;
const PAD_R = 64;

function cssVar(name: string): string {
  if (typeof document === "undefined") return "#888";
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || "#888";
}

interface Anim {
  t0: number;
  dur: number;
}

export class TapeRenderer {
  private canvas: HTMLCanvasElement | null;
  private ctx: CanvasRenderingContext2D | null;
  private rows: LedgerRow[] = [];
  private cssW = 0;
  private cssH = 0;
  private reveal = 0;
  private anim: Anim | null = null;
  private rafId: number | null = null;
  private ro: ResizeObserver | null = null;
  private reduced = reducedMotion().reduced;
  // True once destroy() has run, or if the canvas/2D context was never
  // available in the first place - a stale/detached ref from a component
  // that unmounted before its onMount effect fired, a canvas with no 2D
  // backend, etc. Every method below checks this first and no-ops instead
  // of touching `this.ctx`: a renderer bound to a dead canvas should be
  // inert, never throw. Constructing with a real, live canvas and later
  // calling destroy() through normal teardown remains fully functional.
  private dead = false;

  constructor(canvas: HTMLCanvasElement | null | undefined) {
    this.canvas = canvas ?? null;
    this.ctx = this.canvas ? this.canvas.getContext("2d") : null;
    if (!this.canvas || !this.ctx) {
      this.dead = true;
      return;
    }
    if (typeof ResizeObserver !== "undefined" && this.canvas.parentElement) {
      this.ro = new ResizeObserver(() => this.resize());
      this.ro.observe(this.canvas.parentElement);
    }
    this.resize();
  }

  destroy(): void {
    this.dead = true;
    if (this.rafId != null && typeof cancelAnimationFrame !== "undefined")
      cancelAnimationFrame(this.rafId);
    this.rafId = null;
    if (this.ro) this.ro.disconnect();
    this.ro = null;
  }

  // Draw a fresh set of requests, sweeping them in (or cutting to final if reduced).
  play(rows: LedgerRow[]): void {
    if (this.dead) return;
    this.rows = rows;
    this.resize();
    if (this.dead || !rows.length) return;
    if (this.reduced) {
      this.reveal = rows.length;
      this.draw();
      return;
    }
    this.reveal = 0;
    this.anim = { t0: now(), dur: Math.min(1600, 500 + rows.length * 260) };
    this.loop();
  }

  private resize(): void {
    if (this.dead || !this.canvas || !this.ctx) return;
    const holder = this.canvas.parentElement;
    const w = holder ? holder.clientWidth : this.canvas.clientWidth || 320;
    const rows = Math.max(1, this.rows.length);
    const h = PAD_T + PAD_B + rows * ROW_H + (rows - 1) * ROW_GAP;
    this.cssW = w;
    this.cssH = h;
    const dpr = getDpr();
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.canvas.style.height = h + "px";
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.draw();
  }

  private maxIn(): number {
    let m = 1;
    for (const r of this.rows) m = Math.max(m, r.readTok + r.inputTok + r.writeTok);
    return m;
  }

  private loop(): void {
    if (this.dead) return;
    if (this.rafId == null && typeof requestAnimationFrame !== "undefined")
      this.rafId = requestAnimationFrame((t) => this.tick(t));
  }

  private tick(t: number): void {
    if (this.dead) return;
    this.rafId = null;
    const a = this.anim;
    if (!a) {
      this.draw();
      return;
    }
    const p = Math.min(1, (t - a.t0) / a.dur);
    this.reveal = easeInOut(p) * this.rows.length;
    this.draw();
    if (p >= 1) {
      this.anim = null;
      this.reveal = this.rows.length;
      this.draw();
    } else {
      this.loop();
    }
  }

  private draw(): void {
    if (this.dead || !this.ctx) return;
    const ctx = this.ctx;
    const W = this.cssW;
    const H = this.cssH;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = cssVar("--panel");
    ctx.fillRect(0, 0, W, H);
    const C = {
      read: cssVar("--read"),
      write: cssVar("--write"),
      grey: cssVar("--grey-soft"),
      ink: cssVar("--ink"),
      inkSoft: cssVar("--ink-soft"),
    };
    if (!this.rows.length) {
      ctx.fillStyle = C.inkSoft;
      ctx.font = "12px -apple-system,system-ui,sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText("Run a unit to see its requests drawn to scale.", GUTTER - 56, H / 2);
      return;
    }
    const barX = GUTTER;
    const barMaxW = W - GUTTER - PAD_R;
    const mIn = this.maxIn();
    for (let r = 0; r < this.rows.length; r++) {
      const q = this.rows[r];
      const y = PAD_T + r * (ROW_H + ROW_GAP);
      const reveal = Math.max(0, Math.min(1, this.reveal - r));
      ctx.fillStyle = C.inkSoft;
      ctx.font = "600 9.5px -apple-system,system-ui,sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(q.agent === "main" ? "main" : q.agent, 0, y + ROW_H / 2);
      const totTok = q.readTok + q.inputTok + q.writeTok;
      const rowW = barMaxW * (totTok / mIn);
      ctx.fillStyle = C.grey;
      ctx.fillRect(barX, y, Math.max(0, rowW), ROW_H);
      const segs: { tok: number; c: string }[] = [];
      if (q.readTok > 0) segs.push({ tok: q.readTok, c: C.read }); // cheap read = blue
      if (q.inputTok > 0) segs.push({ tok: q.inputTok, c: C.write }); // fresh work = red
      if (q.writeTok > 0) segs.push({ tok: q.writeTok, c: C.write }); // rewrite = red
      let cursor = 0;
      for (const s of segs) {
        const segW = totTok > 0 ? rowW * (s.tok / totTok) : 0;
        const vis = Math.max(0, Math.min(segW, rowW * reveal - cursor));
        if (vis > 0.4) {
          ctx.fillStyle = s.c;
          ctx.fillRect(barX + cursor, y, vis, ROW_H);
        }
        cursor += segW;
      }
      if (reveal >= 1) {
        ctx.fillStyle = C.inkSoft;
        ctx.font = "600 10px ui-monospace,monospace";
        ctx.textAlign = "left";
        ctx.fillText("$" + q.usd.toFixed(4), barX + rowW + 6, y + ROW_H / 2);
      } else if (reveal > 0) {
        // the scan head: red rewrite / blue read sweep boundary
        const px = barX + rowW * reveal;
        ctx.strokeStyle = C.ink;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(px, y - 2);
        ctx.lineTo(px, y + ROW_H + 2);
        ctx.stroke();
      }
    }
  }
}

function now(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

// Back-compat stub kept for any direct importers.
export function drawTape(): void {
  /* use TapeRenderer */
}
