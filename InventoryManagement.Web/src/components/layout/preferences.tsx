"use client";
import { Moon, Sun, Palette } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/provider";
function save(name: string, value: string) {
  document.cookie =
    name +
    "=" +
    value +
    "; Path=/; Max-Age=31536000; SameSite=Lax" +
    (location.protocol === "https:" ? "; Secure" : "");
}
export function Preferences({
  initialMode,
  initialAccent,
}: {
  initialMode: "dark" | "light";
  initialAccent: "forest" | "indigo";
}) {
  const { m, locale } = useI18n();
  const router = useRouter();
  const [mode, setMode] = useState(initialMode);
  const [accent, setAccent] = useState(initialAccent);
  return (
    <div className="flex shrink-0 items-center gap-2">
      <label className="sr-only" htmlFor="workspace-language">
        {m.preferences.language}
      </label>
      <select
        id="workspace-language"
        aria-label={m.preferences.language}
        className="h-9 rounded-lg border border-line bg-surface px-2 text-xs text-ink"
        value={locale}
        onChange={(event) => {
          save("inventory-locale", event.target.value);
          router.refresh();
        }}
      >
        <option value="en">English</option>
        <option value="tr">Türkçe</option>
      </select>
      <button
        type="button"
        aria-label={mode === "dark" ? m.preferences.light : m.preferences.dark}
        title={mode === "dark" ? m.preferences.light : m.preferences.dark}
        className="grid size-9 place-items-center rounded-lg border border-line text-muted hover:text-brand"
        onClick={() => {
          const next = mode === "dark" ? "light" : "dark";
          setMode(next);
          document.documentElement.dataset.mode = next;
          save("inventory-mode", next);
        }}
      >
        {mode === "dark" ? (
          <Sun className="size-4" />
        ) : (
          <Moon className="size-4" />
        )}
      </button>
      <button
        type="button"
        aria-label={m.preferences.accent}
        title={m.preferences.accent}
        className="grid size-9 place-items-center rounded-lg border border-line text-muted hover:text-brand"
        onClick={() => {
          const next = accent === "forest" ? "indigo" : "forest";
          setAccent(next);
          document.documentElement.dataset.theme = next;
          save("inventory-accent", next);
        }}
      >
        <Palette className="size-4" />
      </button>
    </div>
  );
}
