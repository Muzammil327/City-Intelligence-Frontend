import { describe, expect, it } from "vitest";

import { TABS } from "@/components/dashboard/tabs";
import { LOCALES } from "@/lib/i18n/locales";
import {
  createTranslate,
  getMessages,
  type MessageKey,
} from "@/lib/i18n/messages";

const EN = getMessages("en");
const UR = getMessages("ur");

describe("catalogs", () => {
  it("carries exactly the same keys in both languages", () => {
    // The compiler already rejects a key missing from Urdu. This catches the
    // other half: one left behind in Urdu after English dropped it.
    expect(Object.keys(UR).sort()).toEqual(Object.keys(EN).sort());
  });

  it("has no blank message in any locale", () => {
    for (const locale of LOCALES) {
      for (const [key, value] of Object.entries(getMessages(locale))) {
        expect(value.trim(), `${locale}: ${key}`).not.toBe("");
      }
    }
  });
});

describe("tab message keys", () => {
  it("resolves every key the nav and the page heading look up", () => {
    const keys = TABS.flatMap((tab) =>
      [tab.labelKey, tab.headerTitleKey, tab.descriptionKey].filter(
        (key): key is MessageKey => key !== undefined,
      ),
    );

    expect(keys.length).toBeGreaterThan(0);

    for (const key of keys) {
      expect(EN[key], key).toBeTruthy();
      expect(UR[key], key).toBeTruthy();
    }
  });
});

describe("createTranslate", () => {
  it("returns the message for a key", () => {
    expect(createTranslate(EN)("nav.wordmark")).toBe("City Intelligence");
  });

  it("falls back to the key itself so a gap names itself in the page", () => {
    const sparse = { ...EN, "nav.wordmark": undefined } as unknown as typeof EN;

    expect(createTranslate(sparse)("nav.wordmark")).toBe("nav.wordmark");
  });
});
