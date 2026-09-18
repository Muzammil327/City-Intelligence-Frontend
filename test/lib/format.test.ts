import { describe, expect, it } from "vitest";

import { DISPLAY_TIME_ZONE } from "@/lib/config";
import { formatDateTime, formatHour } from "@/lib/format";

/**
 * The suite runs under TZ=America/New_York (see vitest.setup.ts). Asia/Karachi
 * is UTC+5, so 12:00Z must render as 17:00 — if any formatter fell back to the
 * machine's local zone it would say 08:00 and these would fail.
 */
const NOON_UTC = "2026-09-17T12:00:00.000Z";

describe("formatHour", () => {
  it("renders in the app's display timezone, not the machine's", () => {
    expect(process.env.TZ).toBe("America/New_York");
    expect(DISPLAY_TIME_ZONE).toBe("Asia/Karachi");
    expect(formatHour(NOON_UTC)).toBe("17:00");
  });

  it("uses a 24-hour clock", () => {
    expect(formatHour("2026-09-17T18:30:00.000Z")).toBe("23:30");
  });

  it("rolls over the date boundary in the display timezone", () => {
    // 20:00Z is 01:00 the next day in Karachi.
    expect(formatHour("2026-09-17T20:00:00.000Z")).toBe("01:00");
  });
});

describe("formatDateTime", () => {
  it("includes the day, month and 24-hour time", () => {
    const formatted = formatDateTime(NOON_UTC);
    expect(formatted).toContain("17");
    expect(formatted).toContain("Sep");
    expect(formatted).toContain("17:00");
  });

  it("shows the next day when the display timezone has rolled over", () => {
    expect(formatDateTime("2026-09-17T20:00:00.000Z")).toContain("18");
  });
});
