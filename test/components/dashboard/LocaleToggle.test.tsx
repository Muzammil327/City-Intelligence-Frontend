import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { LocaleProvider } from "@/lib/i18n/context";
import { LOCALE_LABELS, type Locale } from "@/lib/i18n/locales";
import { getMessages } from "@/lib/i18n/messages";

// The action is a server boundary: it writes a cookie and revalidates the
// layout, neither of which exists in jsdom. What this file asserts is which
// locale the button asks for, so the boundary is where the mock goes.
const { setLocale } = vi.hoisted(() => ({ setLocale: vi.fn() }));
vi.mock("@/lib/i18n/set-locale", () => ({ setLocale }));

import { LocaleToggle } from "@/components/dashboard/LocaleToggle";

function renderIn(locale: Locale): void {
  render(
    <LocaleProvider locale={locale} messages={getMessages(locale)}>
      <LocaleToggle />
    </LocaleProvider>,
  );
}

describe("LocaleToggle", () => {
  it("offers Urdu, in Urdu, while the interface is English", () => {
    renderIn("en");
    expect(screen.getByRole("button")).toHaveTextContent(LOCALE_LABELS.ur);
  });

  it("offers English again once the interface is Urdu", () => {
    renderIn("ur");
    expect(screen.getByRole("button")).toHaveTextContent(LOCALE_LABELS.en);
  });

  it("names the language it switches to, for a reader who cannot see it", () => {
    renderIn("en");
    expect(
      screen.getByRole("button", { name: /Switch language/i }),
    ).toBeInTheDocument();
  });

  it("marks the label with its own language so it is announced correctly", () => {
    renderIn("en");
    expect(screen.getByText(LOCALE_LABELS.ur)).toHaveAttribute("lang", "ur");
  });

  it("asks for the other locale when pressed", async () => {
    renderIn("en");
    await userEvent.click(screen.getByRole("button"));

    expect(setLocale).toHaveBeenCalledWith("ur");
  });
});
