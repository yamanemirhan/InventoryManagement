"use client";
import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Check, Copy, LoaderCircle, Send, ShieldCheck, Sparkles, Square, Trash2, X } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api/api-error";
import { useCompanyText } from "@/features/companies/company-provider";
import { useI18n } from "@/lib/i18n/provider";
import { usePathname } from "next/navigation";
import { getErrorMessage } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Message = { role: "user" | "assistant"; text: string; truncated?: boolean };
type Configuration = { available: boolean; name: string; provider: string; model: string; maxMessageLength: number; maxHistoryMessages: number };
const quickLinks = [
  { href: "/products", tr: "Ürünler", en: "Products" },
  { href: "/stocks", tr: "Stoklar", en: "Stock" },
  { href: "/scan", tr: "Kod okut", en: "Scan code" },
  { href: "/reports", tr: "Raporlar", en: "Reports" },
];
function pageContext(path: string) {
  if (path === "/") return "overview";
  if (path === "/stocks/increase") return "stock-receipt";
  if (path === "/stocks/transfer") return "stock-transfer";
  if (path.startsWith("/purchase-orders")) return "purchases";
  return ["products", "warehouses", "stocks", "suppliers", "reports", "imports", "scan", "companies", "knowledge"].find(page => path === `/${page}` || path.startsWith(`/${page}/`)) ?? "other";
}
function contextMessages(messages: Message[], text: string) {
  const history = [...messages.slice(-10).map(m => ({ role: m.role, text: m.text })), { role: "user" as const, text }];
  while (history.length > 1 && history.reduce((sum, m) => sum + m.text.length, 0) > 20000) history.splice(0, 2);
  return history;
}
function CopyAnswer({ text }: { text: string }) {
  const t = useCompanyText();
  const [copied, setCopied] = useState(false);
  const reset = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(reset.current), []);
  return <button type="button" className="mt-2 inline-flex items-center gap-1.5 text-[10px] text-muted hover:text-brand" onClick={async () => {
    try { await navigator.clipboard.writeText(text); setCopied(true); clearTimeout(reset.current); reset.current = setTimeout(() => setCopied(false), 2000); }
    catch { setCopied(false); }
  }}>{copied ? <Check className="size-3" /> : <Copy className="size-3" />}{copied ? t("Kopyalandı", "Copied") : t("Kopyala", "Copy")}</button>;
}

export default function AssistantPanel({ open, onClose, companyId, companyName }: { open: boolean; onClose: () => void; companyId: string; companyName: string }) {
  const t = useCompanyText();
  const { locale } = useI18n();
  const pathname = usePathname();
  const consentId = useId();
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [retryAt, setRetryAt] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const request = useRef<AbortController | null>(null);
  const lock = useRef(false);
  const input = useRef<HTMLTextAreaElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const end = useRef<HTMLDivElement>(null);
  const configuration = useQuery({ queryKey: ["assistant-configuration", companyId], enabled: open,
    queryFn: ({ signal }) => apiClient<Configuration>("/api/assistant/configuration", { signal, cache: "no-store" }), staleTime: 0, retry: false });
  const ready = configuration.data?.available === true && !configuration.isError && !configuration.isFetching;
  const maxLength = Math.min(configuration.data?.maxMessageLength ?? 2000, 2000);
  const suggestions = [
    t("Envanterimi kullanmaya nereden başlamalıyım?", "Where should I start with my inventory?"),
    t("Excel ile toplu aktarımı adım adım anlat.", "Explain bulk Excel import step by step."),
    t("Minimum stok seviyesini nasıl seçmeliyim?", "How should I choose minimum stock levels?"),
    t("Barkodla stok transferini nasıl yaparım?", "How do I transfer stock using a barcode?"),
  ];
  useEffect(() => () => { request.current?.abort(); request.current = null; }, []);
  useEffect(() => {
    if (!open) { request.current?.abort(); return; }
    function escape(event: KeyboardEvent) { if (event.key === "Escape") { event.preventDefault(); onClose(); } }
    window.addEventListener("keydown", escape);
    const focus = window.setTimeout(() => closeButton.current?.focus(), 0);
    return () => { window.clearTimeout(focus); window.removeEventListener("keydown", escape); };
  }, [open, onClose]);
  useEffect(() => { if (open) end.current?.scrollIntoView({ block: "nearest", behavior: "instant" }); }, [messages, busy, error, open]);
  useEffect(() => {
    if (!retryAt || !open) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [retryAt, open]);

  function stop() { request.current?.abort(); }
  function clear() {
    request.current?.abort(); lock.current = false; setBusy(false);
    setMessages([]); setDraft(""); setError("");
    input.current?.focus();
  }
  async function send() {
    const text = draft.trim();
    if (!ready || !consent || lock.current || !text || text.length > maxLength || Date.now() < retryAt) return;
    const controller = new AbortController(); request.current = controller; lock.current = true;
    setBusy(true); setError("");
    // User/assistant pairs remain complete. Failed or cancelled sends keep the user's draft for retry.
    const sent = contextMessages(messages, text);
    try {
      const reply = await apiClient<{ text: string; truncated: boolean }>("/api/assistant/messages", { method: "POST", signal: controller.signal,
        body: { messages: sent, locale, page: pageContext(pathname), externalProcessingAccepted: consent }, cache: "no-store" });
      if (controller.signal.aborted) return;
      setMessages(previous => [...previous.slice(-38), { role: "user", text }, { role: "assistant", text: reply.text, truncated: reply.truncated }]);
      setDraft("");
    } catch (cause) {
      if (!controller.signal.aborted) {
        setError(getErrorMessage(cause));
        if (cause instanceof ApiError && cause.status === 429) { const time = Date.now(); setNow(time); setRetryAt(time + (cause.retryAfterSeconds ?? 60) * 1000); }
      }
    } finally {
      if (request.current === controller) { request.current = null; lock.current = false; setBusy(false); }
    }
  }
  const waiting = Math.max(0, Math.ceil((retryAt - now) / 1000));
  if (!open) return null;
  return <section id="invo-chat-panel" role="dialog" aria-modal="false" aria-labelledby="invo-title"
    className="invo-panel fixed bottom-[max(90px,calc(env(safe-area-inset-bottom)+90px))] right-3 z-50 flex h-[min(650px,calc(100dvh-125px))] w-[min(410px,calc(100vw-24px))] flex-col overflow-hidden rounded-2xl border border-brand/25 bg-surface shadow-2xl sm:right-7">
    <header className="invo-header flex shrink-0 items-center gap-3 border-b border-line px-5 py-4">
      <span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-brand/25 bg-brand-soft text-brand"><Sparkles className="size-5" /></span>
      <div className="min-w-0 flex-1"><h2 id="invo-title" className="text-base font-semibold tracking-tight">Invo <span className="ml-1 rounded-full bg-brand-soft px-2 py-0.5 text-[9px] font-medium text-brand">AI</span></h2><p className="mt-0.5 truncate text-[11px] text-muted">{companyName}</p></div>
      <button type="button" aria-label={t("Yeni sohbet", "New chat")} title={t("Yeni sohbet", "New chat")} onClick={clear} className="rounded-lg p-2 text-muted hover:bg-subtle"><Trash2 className="size-4" /></button>
      <button ref={closeButton} type="button" aria-label={t("Sohbeti kapat", "Close chat")} onClick={onClose} className="rounded-lg p-2 text-muted hover:bg-subtle"><X className="size-4" /></button>
    </header>
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5">
      {!messages.length && <div className="space-y-5">
        <div><p className="text-lg font-semibold leading-7">{t("Daha az uğraş, daha net envanter.", "Less friction. Clearer inventory.")}</p><p className="mt-2 text-sm leading-6 text-muted">{t("Ben Invo. Stok, sipariş ve günlük iş akışlarında sana yol gösterebilirim.", "I'm Invo. I can guide you through stock, purchasing and daily workflows.")}</p></div>
        {ready && <div className="space-y-2">{suggestions.map(prompt => <button type="button" key={prompt} disabled={busy} onClick={() => { setDraft(prompt); input.current?.focus(); }} className="flex w-full items-center justify-between gap-3 rounded-xl border border-line bg-subtle/50 px-3 py-3 text-left text-xs leading-5 transition hover:border-brand/40 hover:bg-brand-soft disabled:cursor-not-allowed disabled:opacity-60"><span>{prompt}</span><ArrowUpRight className="size-3.5 shrink-0 text-brand" /></button>)}</div>}
      </div>}
      {configuration.isFetching && <p role="status" className="mt-4 flex items-center gap-2 text-xs text-muted"><LoaderCircle className="size-3.5 animate-spin motion-reduce:animate-none" />{t("Asistan kontrol ediliyor…", "Checking assistant…")}</p>}
      {configuration.isError && <div role="alert" className="mt-4 rounded-xl bg-danger-soft p-3 text-xs"><p>{getErrorMessage(configuration.error)}</p><button type="button" className="mt-2 font-semibold" onClick={() => { void configuration.refetch(); }}>{t("Tekrar dene", "Retry")}</button></div>}
      {!configuration.isFetching && configuration.data && !configuration.data.available && <div className="mt-4 rounded-xl border border-line bg-subtle p-4"><p className="text-sm font-medium">{t("AI yanıtları henüz etkin değil", "AI replies are not enabled yet")}</p><p className="mt-2 text-xs leading-5 text-muted">{t("Asistan kurulum bekliyor. Şimdilik aşağıdaki hızlı bağlantılarla işine devam edebilirsin.", "The assistant is awaiting setup. Use the quick links below to continue your work.")}</p></div>}
      <div role="log" aria-live="polite" aria-relevant="additions" aria-label={t("Sohbet mesajları", "Chat messages")} className="space-y-5">
        {messages.map((message, index) => <article key={index} className={message.role === "user" ? "ml-8 rounded-2xl rounded-br-sm bg-brand-soft px-4 py-3" : "mr-2 pt-2"}>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted">{message.role === "user" ? t("Sen", "You") : "Invo"}</p>
          <p className="whitespace-pre-wrap break-words text-sm leading-6">{message.text}</p>
          {message.truncated && <p className="mt-2 text-xs text-muted">{t("Yanıt uzunluk sınırına ulaştı. Daha dar bir soru sorabilirsin.", "The response reached its length limit. Try a narrower question.")}</p>}
          {message.role === "assistant" && <CopyAnswer text={message.text} />}
        </article>)}
        {busy && <div role="status" className="mt-4 flex items-center gap-2 rounded-xl bg-subtle p-4 text-xs text-muted"><LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" />{t("Invo düşünüyor…", "Invo is thinking…")}</div>}
      </div>
      {error && <p role="alert" className="mt-4 rounded-xl bg-danger-soft p-3 text-xs leading-5 text-danger">{error}</p>}
      <div ref={end} />
    </div>
    <footer className="shrink-0 space-y-3 border-t border-line bg-surface px-4 pb-4 pt-3">
      <div className="flex flex-wrap gap-2">{quickLinks.map(link => <Link key={link.href} href={link.href} onClick={onClose} className="rounded-full border border-line px-2.5 py-1 text-[10px] text-muted hover:border-brand hover:text-brand">{t(link.tr, link.en)}</Link>)}</div>
      {ready && <details open={!consent} className="text-[11px] text-muted"><summary className="cursor-pointer">{t("Veri paylaşımı", "Data sharing")} · {consent ? t("kabul edildi", "accepted") : t("onay gerekli", "consent needed")}</summary><label htmlFor={consentId} className="mt-2 flex items-start gap-2 leading-4"><input id={consentId} type="checkbox" className="mt-0.5 shrink-0" checked={consent} onChange={e => setConsent(e.target.checked)} /><span>{t("Mesajlarımın Google Gemini'ye iletilmesini kabul ediyorum. Ücretsiz katmanda ürün geliştirmesinde kullanılabilir; hassas bilgi paylaşmayacağım.", "I agree to send my messages to Google Gemini. Free-tier messages may be used to improve its products; I won't share sensitive information.")}</span></label></details>}
      <form onSubmit={event => { event.preventDefault(); void send(); }} className="rounded-xl border border-line bg-subtle p-2 focus-within:border-brand/60">
        <textarea ref={input} aria-label={t("Invo'ya mesaj", "Message Invo")} maxLength={maxLength} rows={2} value={draft} disabled={!ready || busy || waiting > 0}
          placeholder={!ready ? t("AI yanıtları etkinleştirilmeyi bekliyor", "AI replies are awaiting activation") : t("Envanterle ilgili bir şey sor…", "Ask about your inventory workflow…")}
          onChange={event => setDraft(event.target.value)} onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void send(); } }}
          className="max-h-28 w-full resize-none bg-transparent px-2 py-1 text-sm leading-6 outline-none placeholder:text-muted/70 disabled:cursor-not-allowed" />
        <div className="flex items-center justify-between gap-2 px-1"><span className="text-[10px] text-muted">{waiting > 0 ? (waiting >= 3600 ? t(`${Math.ceil(waiting / 3600)} saat sonra deneyin`, `Retry in ${Math.ceil(waiting / 3600)}h`) : waiting >= 60 ? t(`${Math.ceil(waiting / 60)} dk sonra deneyin`, `Retry in ${Math.ceil(waiting / 60)}m`) : t(`${waiting} sn sonra deneyin`, `Retry in ${waiting}s`)) : `${draft.length}/${maxLength}`}</span>
          {busy ? <Button type="button" variant="ghost" className="min-h-8 px-2 py-1 text-xs" onClick={stop}><Square className="size-3" />{t("Durdur", "Stop")}</Button>
            : <Button type="submit" aria-label={t("Mesaj gönder", "Send message")} className="min-h-8 px-3 py-1 text-xs" disabled={!ready || !consent || !draft.trim() || waiting > 0}><Send className="size-3.5" />{t("Gönder", "Send")}</Button>}
        </div>
      </form>
      <p className="flex items-start gap-1.5 text-[10px] leading-4 text-muted"><ShieldCheck className="mt-0.5 size-3 shrink-0" /><span>{t("Canlı şirket verilerini okumaz, işlem yapmaz. Sohbet bu sekmede geçicidir; yeni sohbet, yenileme veya çıkışta silinir. Yanıtları kontrol et.", "No live company data or actions. Chat is temporary in this tab and clears on new chat, reload or sign-out. Check the answers.")}</span></p>
    </footer>
  </section>;
}
