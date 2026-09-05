import { en } from "./en";
// Add another structurally compatible dictionary here, then resolve locale per request.
export type Messages = typeof en;
export const locale = "en";
export const messages: Messages = en;
export function formatCount(value: number, noun: keyof Messages["counts"]) {
  const category = new Intl.PluralRules(locale).select(value);
  const template = messages.counts[noun][category === "one" ? "one" : "other"];
  return template.replace("{count}", formatNumber(value));
}
export const formatNumber = (value: number) =>
  new Intl.NumberFormat(locale).format(value);
export const formatAmount = (value: number) =>
  new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
export const formatDate = (value: string) =>
  new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(value)) + " UTC";
