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
import { RATE, MODEL_IN } from "../engine/pricing.js";
import type { LedgerRow } from "../game/types.js";
import type { WriteTier } from "../engine/types.js";

const ROW_H = 16;
const ROW_GAP = 8;
const PAD_T = 14;
const PAD_B = 10;
const GUTTER = 64;
const PAD_R = 64;

// Cache lifetime in minutes for each write tier (SIMULATOR_SPEC.md C1): the
// 1h main cache vs the cheaper, shorter-lived 5m cache introduced at L6.
const TTL_MIN: Record<WriteTier, number> = { "1h": 60, "5m": 5 };

function fmtMin(min: number): string {
  const m = Math.floor(min);
  const s = Math.round((min - m) * 60);
  return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
}

// One line per priced segment of a request, in the same "tok x mult x
// $perM/M = $usd" shape as engine/session.ts's report lines - the hover
// tooltip shows the actual calculation, not just the total.
function calcLines(row: LedgerRow): string[] {
  const perM = MODEL_IN[row.model];
  const lines: string[] = [];
  const seg = (label: string, tok: number, mult: number) => {
    if (tok <= 0) return;
    // Round for display only (perM * mult can land on a float artifact like
    // 3 * 0.1 = 0.30000000000000004) - the priced `usd` below stays exact.
    const rate = Number((perM * mult).toFixed(4));
    const usd = tok * mult * (perM / 1e6);
    lines.push(`${label}: ${tok.toLocaleString()} tok x ${mult}x x $${rate}/M = $${usd.toFixed(4)}`);
  };
  seg("read", row.readTok, RATE.read);
  seg("input", row.inputTok, RATE.input);
  seg("write", row.writeTok, row.writeTier === "1h" ? RATE.w1h : RATE.w5m);
  seg("output", row.outTok, RATE.out);
  return lines;
}

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
  // Index of the row currently under the pointer, or null. Exposed via
  // getHover() for host components that want a DOM tooltip too, but
  // TapeRenderer also draws its own in-canvas tooltip on hover so callers
  // get "hover shows price calc, time, and cache duration" for free.
  private hoverIndex: number | null = null;
  private onMouseMove = (e: MouseEvent) => this.handleMove(e);
  private onMouseLeave = () => this.setHover(null);

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
    this.canvas.addEventListener("mousemove", this.onMouseMove);
    this.canvas.addEventListener("mouseleave", this.onMouseLeave);
    this.resize();
  }

  private handleMove(e: MouseEvent): void {
    if (this.dead || !this.canvas || !this.rows.length) return;
    const rect = this.canvas.getBoundingClientRect();
    const y = e.clientY - rect.top;
    let idx: number | null = null;
    for (let r = 0; r < this.rows.length; r++) {
      const rowTop = PAD_T + r * (ROW_H + ROW_GAP);
      if (y >= rowTop - ROW_GAP / 2 && y <= rowTop + ROW_H + ROW_GAP / 2 && this.reveal >= r + 1) {
        idx = r;
        break;
      }
    }
    this.setHover(idx);
  }

  private setHover(idx: number | null): void {
    if (this.hoverIndex === idx) return;
    this.hoverIndex = idx;
    this.draw();
  }

  // Row + tooltip text currently hovered, for hosts that render their own
  // DOM tooltip instead of (or in addition to) the in-canvas one.
  getHover(): { row: LedgerRow; lines: string[] } | null {
    if (this.hoverIndex === null) return null;
    const row = this.rows[this.hoverIndex];
    if (!row) return null;
    return { row, lines: this.tooltipLines(row) };
  }

  private tooltipLines(row: LedgerRow): string[] {
    const lines = [`t+${fmtMin(row.tMin)}`, ...calcLines(row), `total: $${row.usd.toFixed(4)}`];
    if (row.writeTok > 0) {
      const ttl = TTL_MIN[row.writeTier];
      lines.push(`cache alive ${ttl}m: t+${fmtMin(row.tMin)} - t+${fmtMin(row.tMin + ttl)}`);
    }
    return lines;
  }

  destroy(): void {
    this.dead = true;
    if (this.rafId != null && typeof cancelAnimationFrame !== "undefined")
      cancelAnimationFrame(this.rafId);
    this.rafId = null;
    if (this.ro) this.ro.disconnect();
    this.ro = null;
    if (this.canvas) {
      this.canvas.removeEventListener("mousemove", this.onMouseMove);
      this.canvas.removeEventListener("mouseleave", this.onMouseLeave);
    }
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
    const geom: { y: number; rowW: number }[] = [];
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
      geom[r] = { y, rowW };
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

    // Hover: price-calc breakdown, request time, and (for cache writes) the
    // TTL window drawn as a bracket under the bar - "hover shows price calc,
    // time, and cache duration on the timeline".
    if (this.hoverIndex !== null && this.reveal >= this.hoverIndex + 1) {
      const q = this.rows[this.hoverIndex];
      const g = geom[this.hoverIndex];
      if (q && g) {
        ctx.strokeStyle = C.ink;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(barX - 1, g.y - 1, Math.max(0, g.rowW) + 2, ROW_H + 2);

        if (q.writeTok > 0) {
          const ttl = TTL_MIN[q.writeTier];
          const by = g.y + ROW_H + 4;
          ctx.strokeStyle = C.inkSoft;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(barX, by);
          ctx.lineTo(barX + Math.max(4, g.rowW), by);
          ctx.stroke();
          ctx.fillStyle = C.inkSoft;
          ctx.font = "9px ui-monospace,monospace";
          ctx.textAlign = "left";
          ctx.textBaseline = "top";
          ctx.fillText(`cache alive ${ttl}m`, barX, by + 2);
        }

        const lines = this.tooltipLines(q);
        ctx.font = "10px ui-monospace,monospace";
        const padX = 6;
        const lineH = 13;
        const boxW = Math.max(...lines.map((l) => ctx.measureText(l).width)) + padX * 2;
        const boxH = lines.length * lineH + 8;
        let bx = barX + 4;
        let by = g.y + ROW_H + 16;
        if (by + boxH > H) by = Math.max(0, g.y - boxH - 4);
        if (bx + boxW > W) bx = Math.max(0, W - boxW);
        ctx.fillStyle = cssVar("--panel-2") || "#111";
        ctx.strokeStyle = C.ink;
        ctx.lineWidth = 1;
        ctx.fillRect(bx, by, boxW, boxH);
        ctx.strokeRect(bx, by, boxW, boxH);
        ctx.fillStyle = C.ink;
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        lines.forEach((l, i) => ctx.fillText(l, bx + padX, by + 4 + i * lineH));
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
