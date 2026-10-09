"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { Compass } from "lucide-react";
import { useAuth } from "@/features/auth/components/auth-provider";
import { useCompany, useCompanyText } from "@/features/companies/company-provider";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setSidebarOpen } from "@/store/slices/inventory-ui-slice";
import { getTourSteps } from "./tour-steps";

const Overlay = dynamic(() => import("./tour-overlay"), { ssr: false });
const startEvent = "inventory:start-tour";
// Fallback when browser storage is blocked. Never store company data, email or tokens.
const seenInThisTab = new Set<string>();
function seen(key: string) {
  if (seenInThisTab.has(key)) return true;
  try { return localStorage.getItem(key) !== null; } catch { return false; }
}

export function OnboardingTour() {
  const auth = useAuth();
  const { company, session, loading, error } = useCompany();
  const pathname = usePathname();
  if (auth.status !== "authenticated" || !session || loading || error || pathname.startsWith("/auth") || pathname === "/account" || pathname.startsWith("/admin")) return null;
  const autoStart = ["/", "/companies", "/products", "/warehouses", "/stocks", "/suppliers", "/purchase-orders", "/reports", "/imports", "/knowledge"].includes(pathname);
  return <TourSession key={`${session.subjectId}:${company?.id ?? "setup"}:${company?.role ?? ""}:${pathname}`} subject={session.subjectId} role={company?.role} hasCompany={!!company} autoStart={autoStart} />;
}

export function OnboardingTourLauncher({ className = "" }: { className?: string }) {
  const t = useCompanyText();
  const { session, loading, error } = useCompany();
  const pathname = usePathname();
  if (!session || loading || error || pathname.startsWith("/auth") || pathname === "/account" || pathname.startsWith("/admin")) return null;
  return <button type="button" data-tour="restart" onClick={() => window.dispatchEvent(new Event(startEvent))} aria-haspopup="dialog"
    className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs transition ${className}`}>
    <Compass className="size-4 shrink-0" />{t("Uygulama turu", "App tour")}
  </button>;
}

function TourSession({ subject, role, hasCompany, autoStart }: { subject: string; role?: string; hasCompany: boolean; autoStart: boolean }) {
  const t = useCompanyText();
  const dispatch = useAppDispatch();
  const sidebarOpen = useAppSelector(state => state.inventoryUi.sidebarOpen);
  const previousSidebar = useRef(sidebarOpen);
  const running = useRef(false);
  const [open, setOpen] = useState(false);
  const storageKey = `inventory-onboarding:v1:${subject}:${hasCompany ? "workspace" : "setup"}`;
  const steps = useMemo(() => {
    const all = getTourSteps(t, role);
    // Before a first company exists, guide setup only. The workspace tour follows after selection.
    return hasCompany ? all : [{ ...all[0], target: '[data-tour="first-company"]' }];
  }, [t, role, hasCompany]);
  const start = useCallback(() => {
    previousSidebar.current = sidebarOpen;
    running.current = true;
    dispatch(setSidebarOpen(true));
    setOpen(true);
  }, [dispatch, sidebarOpen]);
  const close = useCallback((completed: boolean) => {
    seenInThisTab.add(storageKey);
    try { localStorage.setItem(storageKey, completed ? "completed" : "skipped"); } catch { /* In-memory fallback above keeps the tour dismissible. */ }
    running.current = false;
    setOpen(false);
    dispatch(setSidebarOpen(previousSidebar.current));
    requestAnimationFrame(() => Array.from(document.querySelectorAll<HTMLButtonElement>('[data-tour="restart"]')).find(button => button.getClientRects().length)?.focus({ preventScroll: true }));
  }, [dispatch, storageKey]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const editing = document.activeElement?.matches("input, textarea, select, [contenteditable=true]");
      if (autoStart && !seen(storageKey) && !running.current && !editing && !document.querySelector("dialog[open]")) start();
    }, 800);
    return () => window.clearTimeout(timer);
  }, [start, storageKey, autoStart]);
  useEffect(() => {
    function restart() { if (!running.current) start(); }
    window.addEventListener(startEvent, restart);
    return () => window.removeEventListener(startEvent, restart);
  }, [start]);
  useEffect(() => () => { if (running.current) dispatch(setSidebarOpen(previousSidebar.current)); }, [dispatch]);

  return open ? <Overlay steps={steps} t={t} onClose={close} /> : null;
}
