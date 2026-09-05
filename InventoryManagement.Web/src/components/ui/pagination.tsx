import { Button } from "./button";
import { messages as m, formatNumber, formatCount } from "@/lib/i18n";
export function Pagination({
  page,
  pageSize,
  total,
  onChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onChange: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line p-5 text-xs text-muted">
      <span>
        {m.common.page} {formatNumber(page)} {m.common.of} {formatNumber(pages)}{" "}
        · {formatCount(total, "record")}
      </span>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          {m.common.previous}
        </Button>
        <Button
          variant="secondary"
          disabled={page >= pages}
          onClick={() => onChange(page + 1)}
        >
          {m.common.next}
        </Button>
      </div>
    </div>
  );
}
