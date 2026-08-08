// test-setup.dom.ts - shared jsdom test bootstrap for component/e2e tests.
// jsdom implements <canvas> as an element but ships no 2D rendering backend,
// so TapeRenderer's `canvas.getContext("2d")` returns null and every draw
// call throws. The L1 flow only *uses* the tape for visuals - none of the
// game logic reads canvas state back - so a minimal no-op 2D context is a
// faithful stand-in for these tests: it lets TapeRenderer run its real
// code path (resize/play/draw) without crashing, while asserting on the
// same observable game state (ledger, wallet, campaign) everything else in
// this suite already uses.
import "@testing-library/jest-dom/vitest";

function makeCtx2D() {
  const noop = () => {};
  return {
    setTransform: noop,
    clearRect: noop,
    fillRect: noop,
    strokeRect: noop,
    beginPath: noop,
    moveTo: noop,
    lineTo: noop,
    stroke: noop,
    fillText: noop,
    measureText: () => ({ width: 0 }),
    save: noop,
    restore: noop,
    translate: noop,
    scale: noop,
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
    font: "",
    textAlign: "left",
    textBaseline: "middle",
  } as unknown as CanvasRenderingContext2D;
}

if (typeof HTMLCanvasElement !== "undefined") {
  HTMLCanvasElement.prototype.getContext = function () {
    return makeCtx2D();
  } as unknown as typeof HTMLCanvasElement.prototype.getContext;
}

if (typeof (globalThis as any).ResizeObserver === "undefined") {
  (globalThis as any).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
