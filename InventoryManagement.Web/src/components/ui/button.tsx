import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" };
export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return <button className={cn(
    "inline-flex min-h-10 items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-55",
    variant === "primary" && "bg-slate-950 text-white hover:bg-slate-800 focus-visible:outline-slate-900",
    variant === "secondary" && "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 focus-visible:outline-slate-600",
    variant === "ghost" && "text-slate-700 hover:bg-slate-100 focus-visible:outline-slate-600", className)} {...props} />;
}
