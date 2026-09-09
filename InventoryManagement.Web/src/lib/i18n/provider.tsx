"use client";
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { createI18n, type Locale, type I18n } from "./index";
const Context = createContext<I18n>(createI18n("en"));
export function I18nProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  const value = useMemo(() => createI18n(locale), [locale]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export const useI18n = () => useContext(Context);
