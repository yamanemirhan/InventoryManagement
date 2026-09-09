"use client";
import { Search } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
export function ListToolbar({
  value,
  onChange,
  count,
}: {
  value: string;
  onChange: (value: string) => void;
  count: number;
}) {
  const { m, formatCount } = useI18n();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-5">
      <div className="relative w-full sm:w-80">
        <Search className="absolute left-3 top-3 size-4 text-muted" />
        <input
          type="search"
          aria-label={m.common.searchLabel}
          placeholder={m.common.search}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="field pl-10"
        />
      </div>
      <span className="text-xs text-muted">{formatCount(count, "record")}</span>
    </div>
  );
}
