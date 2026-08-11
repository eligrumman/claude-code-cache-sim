export interface RawTurn {
  label?: string;
  iso?: string;
  systemTok?: number;
  toolsTok?: number;
  messagesTok?: number;
  cacheWrite?: number;
  cacheRead?: number;
  freshInput?: number;
  output?: number;
}

export const REAL_SEGMENT_PROVENANCE = {
  real: true,
  source: "mitmproxy capture, 2026-08-10",
  file: "src/sim/captures/real-session-segments.jsonl",
} as const;

export const REAL_SEGMENT_MODEL = "opus" as const;

export const REAL_SEGMENT_ROWS = [
  { label: "Turn 1", iso: "2026-08-10T10:13:44", systemTok: 3746, toolsTok: 21265, messagesTok: 20390, nTools: 14, cacheWrite: 23921, cacheRead: 21478, freshInput: 2, output: 567 },
  { label: "Turn 2", iso: "2026-08-10T10:13:57", systemTok: 3737, toolsTok: 21127, messagesTok: 21418, nTools: 14, cacheWrite: 881, cacheRead: 45399, freshInput: 2, output: 104 },
  { label: "Turn 3", iso: "2026-08-10T10:13:59", systemTok: 3733, toolsTok: 21101, messagesTok: 22054, nTools: 14, cacheWrite: 104, cacheRead: 46280, freshInput: 504, output: 9 },
  { label: "Turn 4", iso: "2026-08-10T10:14:20", systemTok: 3733, toolsTok: 21101, messagesTok: 21575, nTools: 14, cacheWrite: 23, cacheRead: 46384, freshInput: 2, output: 381 },
  { label: "Turn 5", iso: "2026-08-10T10:14:44", systemTok: 3730, toolsTok: 21088, messagesTok: 22207, nTools: 14, cacheWrite: 616, cacheRead: 46407, freshInput: 2, output: 79 },
  { label: "Turn 6", iso: "2026-08-10T10:14:45", systemTok: 3726, toolsTok: 21062, messagesTok: 22818, nTools: 14, cacheWrite: 79, cacheRead: 47023, freshInput: 504, output: 7 },
] as const satisfies readonly (RawTurn & { nTools: number })[];

export function formatTokenCount(tokens: number | undefined): string {
  if (tokens === undefined) return "—";
  if (Math.abs(tokens) < 1000) return String(tokens);
  const rounded = (tokens / 1000).toFixed(1).replace(/\.0$/, "");
  return `${rounded}K`;
}
