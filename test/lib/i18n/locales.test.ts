import { describe, expect, it } from "vitest";

import {
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_DIRECTIONS,
  LOCALE_LABELS,
  isLocale,
  localeFrom,
  nextLocale,
} from "@/lib/i18n/locales";

describe("isLocale", () => {
  it("accepts every locale the app ships", () => {
    for (const locale of LOCALES) {
      expect(isLocale(locale)).toBe(true);
    }
  });

  it("rejects a language the app has no messages for", () => {
    expect(isLocale("fr")).toBe(false);
    expect(isLocale("EN")).toBe(false);
    expect(isLocale("ur-PK")).toBe(false);
  });

  it("rejects the shapes a cookie or an action argument can actually be", () => {
    expect(isLocale(undefined)).toBe(false);
    expect(isLocale(null)).toBe(false);
    expect(isLocale("")).toBe(false);
    expect(isLocale(42)).toBe(false);
    expect(isLocale({ toString: () => "ur" })).toBe(false);
  });
});

describe("localeFrom", () => {
  it("keeps a value that names a real locale", () => {
    expect(localeFrom("ur")).toBe("ur");
    expect(localeFrom("en")).toBe("en");
  });

  it("falls back rather than passing an unknown value to the catalog", () => {
    expect(localeFrom("de")).toBe(DEFAULT_LOCALE);
    expect(localeFrom(undefined)).toBe(DEFAULT_LOCALE);
    expect(localeFrom(null)).toBe(DEFAULT_LOCALE);
    expect(localeFrom("../../etc/passwd")).toBe(DEFAULT_LOCALE);
  });
});

describe("nextLocale", () => {
  it("returns the other locale", () => {
    expect(nextLocale("en")).toBe("ur");
    expect(nextLocale("ur")).toBe("en");
  });

  it("returns to where it started after two switches", () => {
    for (const locale of LOCALES) {
      expect(nextLocale(nextLocale(locale))).toBe(locale);
    }
  });
});

describe("locale metadata", () => {
  it("gives every locale a direction and a name of its own", () => {
    for (const locale of LOCALES) {
      expect(LOCALE_DIRECTIONS[locale]).toMatch(/^(ltr|rtl)$/);
      expect(LOCALE_LABELS[locale].length).toBeGreaterThan(0);
    }
  });

  it("reads Urdu right to left", () => {
    expect(LOCALE_DIRECTIONS.ur).toBe("rtl");
    expect(LOCALE_DIRECTIONS.en).toBe("ltr");
  });
});
