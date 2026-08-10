import { describe, expect, it } from "vitest";
import { formatTokenCount, REAL_SEGMENT_ROWS } from "../sim/captures/realSegments.js";

describe("raw capture data", () => {
  it("keeps the six captured turns and their API accounting intact", () => {
    expect(REAL_SEGMENT_ROWS).toHaveLength(6);
    expect(REAL_SEGMENT_ROWS.every((row) => !Number.isNaN(Date.parse(row.iso)))).toBe(true);
    expect(REAL_SEGMENT_ROWS[0]).toMatchObject({ iso: "2026-08-10T10:13:44", systemTok: 3746, toolsTok: 21265, messagesTok: 20390, cacheWrite: 23921, cacheRead: 21478, freshInput: 2, output: 567 });
    expect(REAL_SEGMENT_ROWS[5]).toMatchObject({ iso: "2026-08-10T10:14:45", cacheWrite: 79, cacheRead: 47023, freshInput: 504, output: 7 });
  });

  it("formats token counts compactly", () => {
    expect(formatTokenCount(3746)).toBe("3.7K");
    expect(formatTokenCount(21000)).toBe("21K");
    expect(formatTokenCount(504)).toBe("504");
    expect(formatTokenCount(undefined)).toBe("—");
  });
});
