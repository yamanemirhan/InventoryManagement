import Link from "next/link";
import type { ReactNode } from "react";
import { buttonStyles } from "./button";
import { cn } from "@/lib/utils";
export function LinkButton({
  href,
  children,
  secondary = false,
}: {
  href: string;
  children: ReactNode;
  secondary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        buttonStyles,
        secondary
          ? "border border-line bg-surface text-ink hover:bg-subtle"
          : "bg-brand text-on-brand hover:bg-brand-hover",
      )}
    >
      {children}
    </Link>
  );
}
