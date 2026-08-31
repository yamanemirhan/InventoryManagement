import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
export function Alert({ children, title, tone = "info" }: { children?: ReactNode; title: string; tone?: "info" | "error" | "success" }) {
  const Icon = tone === "error" ? AlertCircle : tone === "success" ? CheckCircle2 : Info;
  return <div role={tone === "error" ? "alert" : "status"} className={cn("flex gap-3 rounded-lg border p-4 text-sm", tone === "error" && "border-red-200 bg-red-50 text-red-900", tone === "success" && "border-emerald-200 bg-emerald-50 text-emerald-900", tone === "info" && "border-blue-200 bg-blue-50 text-blue-950")}><Icon className="mt-0.5 size-5 shrink-0" aria-hidden="true" /><div><p className="font-semibold">{title}</p>{children ? <div className="mt-1 leading-6">{children}</div> : null}</div></div>;
}
