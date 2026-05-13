import type { Locale } from "./types";
import { localeLabels, locales } from "./types";
import { en } from "./en";
import { hi } from "./hi";
import { kn } from "./kn";
import { mr } from "./mr";
import { pa } from "./pa";
import { ta } from "./ta";
import { te } from "./te";

export const dictionaries = {
  en,
  hi,
  kn,
  te,
  ta,
  mr,
  pa,
} as const;

export type { Locale };
export { locales, localeLabels };

export function translate(locale: Locale, key: string): string {
  const dict = dictionaries[locale] ?? en;
  return dict[key] ?? en[key] ?? key;
}
