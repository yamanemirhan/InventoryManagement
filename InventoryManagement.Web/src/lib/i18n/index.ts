import { en } from "./en";
import { tr } from "./tr";
export type Messages = typeof en;
export type Locale = "en" | "tr";
export const defaultLocale: Locale = "en";
export const resolveLocale = (value?: string): Locale =>
  value === "tr" ? "tr" : "en";
export function createI18n(locale: Locale) {
  const m: Messages = locale === "tr" ? tr : en;
  const formatNumber = (value: number) =>
    new Intl.NumberFormat(locale).format(value);
  const formatAmount = (value: number) =>
    new Intl.NumberFormat(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  const formatDate = (value: string) =>
    new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "UTC",
    }).format(new Date(value)) + " UTC";
  const formatCount = (value: number, noun: keyof Messages["counts"]) =>
    m.counts[noun][
      new Intl.PluralRules(locale).select(value) === "one" ? "one" : "other"
    ].replace("{count}", formatNumber(value));
  return { m, locale, formatNumber, formatAmount, formatDate, formatCount };
}
export type I18n = ReturnType<typeof createI18n>;
export function getClientI18n() {
  return createI18n(
    resolveLocale(
      typeof document === "undefined"
        ? undefined
        : document.documentElement.lang,
    ),
  );
}
