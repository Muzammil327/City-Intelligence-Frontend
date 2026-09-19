import type { Metadata } from "next";
import { Inter, Noto_Nastaliq_Urdu } from "next/font/google";

import { getLocale } from "@/lib/i18n/get-locale";
import { LOCALE_DIRECTIONS } from "@/lib/i18n/locales";
import { createTranslate, getMessages } from "@/lib/i18n/messages";

import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

/**
 * Urdu is Nastaliq; the Latin face has no Arabic-script coverage at all, so
 * without this the interface falls back to whatever the device happens to
 * have. `preload: false` because only the Urdu render uses it — preloading
 * would make every English reader pay for a face they never see. The variable
 * is attached to `<html>` only for that locale, and `app/globals.css` points
 * `--font-app` at it there.
 */
const notoNastaliqUrdu = Noto_Nastaliq_Urdu({
  variable: "--font-noto-nastaliq-urdu",
  subsets: ["arabic"],
  preload: false,
});

export async function generateMetadata(): Promise<Metadata> {
  const t = createTranslate(getMessages(await getLocale()));

  return {
    title: t("metadata.title"),
    description: t("metadata.description"),
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();
  const messages = getMessages(locale);

  // The Urdu face is only mounted for the Urdu render; see the loader above.
  const fontVariables =
    locale === "ur"
      ? `${inter.variable} ${notoNastaliqUrdu.variable}`
      : inter.variable;

  return (
    <html
      lang={locale}
      dir={LOCALE_DIRECTIONS[locale]}
      /**
       * Dark is the design, not a preference: the glass surfaces, the aurora
       * wash and the AQI palette are all tuned against a near-black ground.
       * The light tokens stay in `globals.css` so a theme switch remains
       * possible, but nothing selects them today.
       */
      className={`dark ${fontVariables} h-full antialiased`}
    >
      <body className="relative min-h-full flex flex-col">
        <Providers locale={locale} messages={messages}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
