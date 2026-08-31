import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={cn("h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-950 shadow-sm outline-none placeholder:text-slate-400 focus:border-slate-600 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100", className)} {...props} />;
});
