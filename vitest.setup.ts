/**
 * Run the whole suite in a timezone that is deliberately *not* the app's
 * display timezone. Anything that formats a date against the machine's local
 * zone instead of `DISPLAY_TIME_ZONE` will produce the wrong string and fail.
 */
process.env.TZ = "America/New_York";

import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// jsdom implements neither of these; Radix and Recharts both expect them.
class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

globalThis.ResizeObserver ??= ResizeObserverStub;

globalThis.matchMedia ??= ((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: () => {},
  removeListener: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => false,
})) as typeof globalThis.matchMedia;

afterEach(cleanup);
