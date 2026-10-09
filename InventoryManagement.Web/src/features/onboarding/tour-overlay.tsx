"use client";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, ArrowRight, Check, Compass, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TourStep, TourText } from "./tour-steps";

type Rect = { top: number; left: number; width: number; height: number };
type Position = { highlight: Rect | null; top: number; left: number };

function visibleTarget(selector: string) {
  for (const candidate of selector.split(",")) {
    const target = Array.from(document.querySelectorAll<HTMLElement>(candidate)).find(element => {
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && getComputedStyle(element).visibility !== "hidden";
    });
    if (target) return target;
  }
}

export default function TourOverlay({ steps, t, onClose }: { steps: TourStep[]; t: TourText; onClose: (completed: boolean) => void }) {
  const [index, setIndex] = useState(0);
  const [position, setPosition] = useState<Position | null>(null);
  const panel = useRef<HTMLElement>(null);
  const focused = useRef(false);
  const titleId = useId();
  const descriptionId = useId();
  const step = steps[Math.min(index, steps.length - 1)];
  const close = useRef(onClose);
  useEffect(() => { close.current = onClose; }, [onClose]);

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const shell = document.querySelector<HTMLElement>("[data-tour-shell]");
    const wasInert = shell?.inert ?? false;
    if (shell) shell.inert = true;
    const overflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    const scroll = { x: window.scrollX, y: window.scrollY };
    const containers = Array.from(document.querySelectorAll<HTMLElement>("[data-tour-scroll]")).map(element => ({ element, top: element.scrollTop }));
    function keyboard(event: KeyboardEvent) {
      if (event.key === "Escape") { event.preventDefault(); close.current(false); }
      if (event.key === "Tab") {
        const buttons = Array.from(panel.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") ?? []);
        const first = buttons[0]; const last = buttons.at(-1);
        if (!first || !last) return;
        if (event.shiftKey && (document.activeElement === first || !panel.current?.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && (document.activeElement === last || !panel.current?.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
      }
    }
    document.addEventListener("keydown", keyboard);
    return () => {
      document.removeEventListener("keydown", keyboard);
      if (shell) shell.inert = wasInert;
      document.documentElement.style.overflow = overflow;
      containers.forEach(({ element, top }) => { element.scrollTop = top; });
      window.scrollTo({ left: scroll.x, top: scroll.y, behavior: "instant" });
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    if (position && !focused.current) {
      focused.current = true;
      panel.current?.querySelector<HTMLButtonElement>("[data-tour-next]")?.focus({ preventScroll: true });
    }
  }, [position]);

  useEffect(() => {
    let frame = 0;
    let aligned = false;
    const target = visibleTarget(step.target);
    // Scroll within the sidebar/mobile menu; never navigate or click a business action.
    target?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "instant" });
    function measure() {
      const width = document.documentElement.clientWidth; const height = window.innerHeight;
      const margin = 12; const gap = 16;
      const cardWidth = panel.current?.offsetWidth ?? Math.min(368, width - margin * 2);
      const cardHeight = panel.current?.offsetHeight ?? 340;
      const currentTarget = visibleTarget(step.target);
      const raw = currentTarget?.getBoundingClientRect();
      const left = raw ? Math.max(6, raw.left - 5) : 0;
      const top = raw ? Math.max(6, raw.top - 5) : 0;
      const right = raw ? Math.min(width - 6, raw.right + 5) : 0;
      const bottom = raw ? Math.min(height - 6, raw.bottom + 5) : 0;
      const highlight = raw && right > left && bottom > top ? { left, top, width: right - left, height: bottom - top } : null;
      const clampX = (x: number) => Math.max(margin, Math.min(x, width - cardWidth - margin));
      const clampY = (y: number) => Math.max(margin, Math.min(y, height - cardHeight - margin));
      let cardLeft = (width - cardWidth) / 2; let cardTop = (height - cardHeight) / 2;
      if (highlight) {
        if (right + gap + cardWidth <= width - margin) { cardLeft = right + gap; cardTop = clampY(top); }
        else if (left - gap - cardWidth >= margin) { cardLeft = left - gap - cardWidth; cardTop = clampY(top); }
        else if (bottom + gap + cardHeight <= height - margin) { cardLeft = clampX(left); cardTop = bottom + gap; }
        else if (top - gap - cardHeight >= margin) { cardLeft = clampX(left); cardTop = top - gap - cardHeight; }
        else {
          if (!aligned && currentTarget) {
            aligned = true;
            currentTarget.scrollIntoView({ block: "start", inline: "nearest", behavior: "instant" });
            schedule();
            return;
          }
          cardLeft = clampX(left); cardTop = clampY(height - cardHeight - margin);
        }
      }
      setPosition({ highlight, left: clampX(cardLeft), top: clampY(cardTop) });
    }
    function schedule() { cancelAnimationFrame(frame); frame = requestAnimationFrame(measure); }
    const observer = new ResizeObserver(schedule);
    if (target) observer.observe(target);
    if (panel.current) observer.observe(panel.current);
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, true);
    schedule();
    return () => { cancelAnimationFrame(frame); observer.disconnect(); window.removeEventListener("resize", schedule); window.removeEventListener("scroll", schedule, true); };
  }, [step, t]);

  const Icon = step.icon;
  return createPortal(<div className="tour-overlay fixed inset-0 z-[80]" style={{ background: position?.highlight ? undefined : "rgb(5 15 18 / .66)" }}>
    {position?.highlight && <div aria-hidden="true" className="tour-spotlight pointer-events-none fixed rounded-xl" style={position.highlight} />}
    <section ref={panel} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId}
      className="tour-card fixed flex max-h-[70dvh] w-[min(368px,calc(100vw-24px))] flex-col overflow-hidden rounded-2xl border border-brand/30 bg-surface shadow-2xl sm:max-h-[calc(100dvh-24px)]"
      style={{ left: position?.left ?? 12, top: position?.top ?? 12, visibility: position ? "visible" : "hidden" }}>
      <div className="flex shrink-0 items-center justify-between border-b border-line px-5 py-3">
        <span className="flex items-center gap-2 text-[11px] font-semibold text-brand"><Compass className="size-4" />{t("Hızlı başlangıç", "Quick start")}</span>
        <button type="button" aria-label={t("Turu atla", "Skip tour")} onClick={() => onClose(false)} className="rounded-lg p-2 text-muted hover:bg-subtle"><X className="size-4" /></button>
      </div>
      <div key={step.id} className="tour-step min-h-0 overflow-y-auto overscroll-contain space-y-4 px-6 py-5" aria-live="polite" aria-atomic="true">
        <div className="flex items-center justify-between"><span className="grid size-12 place-items-center rounded-2xl bg-brand-soft text-brand"><Icon className="size-6" strokeWidth={1.6} /></span><span className="text-xs tabular-nums text-muted">{index + 1} / {steps.length}</span></div>
        <h2 id={titleId} className="text-xl font-semibold leading-7 tracking-tight">{step.title}</h2>
        <p id={descriptionId} className="text-sm leading-6 text-muted">{step.description}</p>
        <p className="rounded-xl border border-brand/15 bg-brand-soft p-3 text-xs leading-5">{step.hint}</p>
      </div>
      <div className="flex shrink-0 gap-1 px-6 pb-4" role="progressbar" aria-label={t("Tur ilerlemesi", "Tour progress")} aria-valuemin={0} aria-valuemax={steps.length} aria-valuenow={index + 1}>
        {steps.map((item, number) => <span key={item.id} className={`h-1 flex-1 rounded-full transition-colors ${number <= index ? "bg-brand" : "bg-line"}`} />)}
      </div>
      <footer className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-3">
        <Button type="button" variant="ghost" className="px-2 text-xs" onClick={() => onClose(false)}>{t("Şimdilik geç", "Skip for now")}</Button>
        <div className="flex gap-1">
          <Button type="button" variant="ghost" className="px-2 text-xs" disabled={index === 0} onClick={() => setIndex(value => value - 1)} aria-label={t("Önceki adım", "Previous step")}><ArrowLeft className="size-4" /></Button>
          <Button data-tour-next type="button" className="text-xs" onClick={() => index === steps.length - 1 ? onClose(true) : setIndex(value => value + 1)}>
            {index === steps.length - 1 ? <><Check className="size-4" />{t("Hazırım", "I'm ready")}</> : <>{t("İleri", "Next")}<ArrowRight className="size-4" /></>}
          </Button>
        </div>
      </footer>
    </section>
  </div>, document.body);
}
