"use client";
import { useCallback, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Sparkles, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/features/auth/components/auth-provider";
import { useCompany, useCompanyText } from "@/features/companies/company-provider";

const AssistantPanel = dynamic(() => import("./assistant-panel"), { ssr: false,
  loading: () => <div className="panel fixed bottom-24 right-5 z-50 w-[min(390px,calc(100vw-40px))] p-6" role="status">Invo…</div>,
});

export function AssistantWidget() {
  const auth = useAuth();
  const { company, loading, error } = useCompany();
  const pathname = usePathname();
  if (auth.status !== "authenticated" || !company || loading || error || pathname.startsWith("/auth") || pathname === "/account") return null;
  return <AssistantSession key={`${auth.client?.subject}-${company.id}`} companyId={company.id} companyName={company.name} />;
}
function AssistantSession({ companyId, companyName }: { companyId: string; companyName: string }) {
  const t = useCompanyText();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const launcher = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => { setOpen(false); launcher.current?.focus(); }, []);
  return <>
    {mounted && <AssistantPanel open={open} onClose={close} companyId={companyId} companyName={companyName} />}
    <button ref={launcher} data-tour="assistant" type="button" onClick={() => { setMounted(true); setOpen(!open); }} aria-expanded={open}
      aria-controls="invo-chat-panel" aria-label={open ? t("Invo sohbetini kapat", "Close Invo chat") : t("Invo ile konuş", "Chat with Invo")}
      className="invo-launcher fixed bottom-[max(20px,env(safe-area-inset-bottom))] right-5 z-50 flex h-14 items-center gap-3 rounded-full border border-brand/30 bg-surface px-5 text-ink shadow-xl transition hover:-translate-y-0.5 hover:border-brand sm:right-7">
      <span className="invo-orb grid size-9 place-items-center rounded-full bg-brand text-on-brand">{open ? <X className="size-4" /> : <Sparkles className="size-5" />}</span>
      <span className="text-left"><span className="block text-sm font-semibold">Invo</span><span className="block text-[10px] text-muted">{t("Envanter asistanın", "Your inventory assistant")}</span></span>
    </button>
  </>;
}
