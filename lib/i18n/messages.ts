import { DEFAULT_LOCALE, type Locale } from "./locales";
import en from "./messages/en.json";
import ur from "./messages/ur.json";

/**
 * The interface strings, one flat catalog per locale.
 *
 * Flat dotted keys rather than nested objects: a key is then a single string
 * literal, which means `MessageKey` is a closed union and every lookup in the
 * app is checked by the compiler rather than by a test.
 *
 * `en.json` is the source of truth — it defines the keys. `ur.json` is typed
 * against it below, so a key missing from Urdu is a build error, not a blank
 * label discovered in the browser.
 */

export type MessageKey = keyof typeof en;

export type Messages = Record<MessageKey, string>;

export type Translate = (key: MessageKey) => string;

const CATALOGS: Record<Locale, Messages> = { en, ur };

/** The catalog for a locale. */
export function getMessages(locale: Locale): Messages {
  return CATALOGS[locale] ?? CATALOGS[DEFAULT_LOCALE];
}

/**
 * A lookup bound to one catalog.
 *
 * Falls back to the key itself rather than an empty string: a visible
 * `nav.footnote` in the page says which key is missing, where an empty span
 * says nothing at all.
 */
export function createTranslate(messages: Messages): Translate {
  return (key) => messages[key] ?? key;
}
