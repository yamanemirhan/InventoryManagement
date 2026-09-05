import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
export const buttonStyles =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";
export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  return (
    <button
      className={cn(
        buttonStyles,
        variant === "primary" && "bg-brand text-on-brand hover:bg-brand-hover",
        variant === "secondary" &&
          "border border-line bg-surface text-ink hover:bg-subtle",
        variant === "ghost" && "text-muted hover:bg-subtle",
        variant === "danger" && "bg-danger text-on-brand",
        className,
      )}
      {...props}
    />
  );
}
