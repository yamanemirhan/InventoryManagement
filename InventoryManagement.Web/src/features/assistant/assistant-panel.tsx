"use client";
import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Check, Copy, LoaderCircle, Send, ShieldCheck, Sparkles, Square, Trash2, X } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api/api-error";
import { useCompanyText } from "@/features/companies/company-provider";
import { useI18n } from "@/lib/i18n/provider";
import { usePathname } from "next/navigation";
import { getErrorMessage } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { pageContext, type AssistantConfiguration, type AssistantReply } from "./assistant-types";

type Message = { role: "user" | "assistant"; text: string; reply?: AssistantReply };
function contextMessages(messages: Message[], text: string) {
  const history = [...messages.slice(-10).map(m => ({ role: m.role, text: m.text })), { role: "user" as const, text }];
  while (history.length > 1 && history.reduce((sum, m) => sum + m.text.length, 0) > 20000) history.splice(0, 2);
  return history;
}
function CopyAnswer({ text }: { text: string }) {
  const t = useCompanyText(); const [copied, setCopied] = useState(false);
  const reset = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(reset.current), []);
  return <button type="button" className="mt-2 inline-flex items-center gap-1.5 text-[10px] text-muted hover:text-brand" onClick={async () => {
    try { await navigator.clipboard.writeText(text); setCopied(true); clearTimeout(reset.current); reset.current = setTimeout(() => setCopied(false), 2000); }
    catch { setCopied(false); }
  }}>{copied ? <Check className="size-3" /> : <Copy className="size-3" />}{copied ? t("Kopyalandı", "Copied") : t("Kopyala", "Copy")}</button>;
}
function ReplyNotice({ reply }: { reply: AssistantReply }) {
  const t = useCompanyText();
  if (!reply.noticeCode) return null;
  const reason = reply.noticeCode === "assistant_provider_quota"
    ? t("Bulut sağlayıcısının kotası dolu.", "The cloud provider's quota is exhausted.")
    : reply.noticeCode === "assistant_daily_limit"
      ? t("Uygulamanın günlük bulut limiti doldu.", "The application's daily cloud limit was reached.")
      : reply.noticeCode === "company_cloud_not_configured"
        ? t("Şirket verileri için Groq bağlantısı henüz etkin değil.", "Groq is not yet enabled for company data.")
        : t("Bulut açıklaması şu anda kullanılamıyor.", "Cloud explanations are temporarily unavailable.");
  return <p className="mb-3 rounded-lg border border-line bg-subtle p-2 text-[11px] leading-5 text-muted">{reason} {t("Yerel kaynaklar ve hesaplanan öneriler kullanılabilir.", "Local sources and calculated insights remain available.")}
    {reply.retryAfterSeconds > 0 && <> {t("Bulut için bekleme", "Cloud wait")}: {Math.ceil(reply.retryAfterSeconds / 60)} {t("dk", "min")}.</>}</p>;
}

export default function AssistantPanel({ open, onClose, companyId, companyName, initialPrompt = "" }: { open: boolean; onClose: () => void; companyId: string; companyName: string; initialPrompt?: string }) {
  const t = useCompanyText(); const { locale, formatDate } = useI18n(); const pathname = usePathname(); const consentId = useId();
  const [mode, setMode] = useState<"company" | "guide">("company");
  const [messages, setMessages] = useState<Message[]>([]); const [draft, setDraft] = useState(initialPrompt);
  const [consent, setConsent] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const [retryAt, setRetryAt] = useState(0); const [now, setNow] = useState(() => Date.now());
  const request = useRef<AbortController | null>(null); const lock = useRef(false);
  const input = useRef<HTMLTextAreaElement>(null); const closeButton = useRef<HTMLButtonElement>(null); const end = useRef<HTMLDivElement>(null);
  const configuration = useQuery({ queryKey: ["assistant-configuration", companyId], enabled: open,
    queryFn: ({ signal }) => apiClient<AssistantConfiguration>("/api/assistant/configuration", { signal, cache: "no-store" }), staleTime: 0, retry: false });
  const ready = configuration.data?.available === true && !configuration.isError;
  const cloudAvailable = mode === "company" ? configuration.data?.companyCloudAvailable : configuration.data?.cloudAvailable;
  const maxLength = Math.min(configuration.data?.maxMessageLength ?? 2000, 2000);
  const suggestions = mode === "company" ? [
    t("Stok eksikleri için ne önerirsin?", "What should I review for stock shortages?"),
    t("Şirketimin depo ve stok kurallarını bul.", "Find my company's warehouse and stock rules."),
    t("Açık siparişler için neyi kontrol etmeliyim?", "What should I check for open purchases?"),
  ] : [t("Excel ile toplu aktarımı adım adım anlat.", "Explain bulk Excel import step by step."), t("Barkodla stok transferini nasıl yaparım?", "How do I transfer stock using a barcode?")];
  useEffect(() => () => { request.current?.abort(); request.current = null; }, []);
  useEffect(() => {
    if (!open) { request.current?.abort(); return; }
    function escape(event: KeyboardEvent) { if (event.key === "Escape") { event.preventDefault(); onClose(); } }
    window.addEventListener("keydown", escape); const focus = window.setTimeout(() => closeButton.current?.focus(), 0);
    return () => { window.clearTimeout(focus); window.removeEventListener("keydown", escape); };
  }, [open, onClose]);
  useEffect(() => { if (open) end.current?.scrollIntoView({ block: "nearest", behavior: "instant" }); }, [messages, busy, error, open]);
  useEffect(() => {
    if (!retryAt || !open) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [retryAt, open]);
  function clear() {
    request.current?.abort(); request.current = null; lock.current = false; setBusy(false);
    setMessages([]); setDraft(""); setError(""); input.current?.focus();
  }
  async function send() {
    const text = draft.trim();
    if (!ready || lock.current || !text || text.length > maxLength || Date.now() < retryAt) return;
    const controller = new AbortController(); request.current = controller; lock.current = true; setBusy(true); setError("");
    try {
      const reply = await apiClient<AssistantReply>("/api/assistant/messages", { method: "POST", signal: controller.signal,
        body: { messages: contextMessages(messages, text), locale, page: pageContext(pathname), mode, externalProcessingAccepted: consent && !!cloudAvailable }, cache: "no-store" });
      if (controller.signal.aborted) return;
      setMessages(previous => [...previous.slice(-38), { role: "user", text }, { role: "assistant", text: reply.text, reply }]); setDraft("");
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
    className="invo-panel fixed bottom-[max(90px,calc(env(safe-area-inset-bottom)+90px))] right-3 z-50 flex h-[min(700px,calc(100dvh-125px))] w-[min(440px,calc(100vw-24px))] flex-col overflow-hidden rounded-2xl border border-brand/25 bg-surface shadow-2xl sm:right-7">
    <header className="invo-header flex shrink-0 items-center gap-3 border-b border-line px-5 py-4">
      <span className="grid size-10 shrink-0 place-items-center rounded-2xl border border-brand/25 bg-brand-soft text-brand"><Sparkles className="size-5" /></span>
      <div className="min-w-0 flex-1"><h2 id="invo-title" className="text-base font-semibold">Invo</h2><p className="truncate text-[11px] text-muted">{companyName}</p></div>
      <button type="button" aria-label={t("Yeni sohbet", "New chat")} onClick={clear} className="rounded-lg p-2 text-muted hover:bg-subtle"><Trash2 className="size-4" /></button>
      <button ref={closeButton} type="button" aria-label={t("Sohbeti kapat", "Close chat")} onClick={onClose} className="rounded-lg p-2 text-muted hover:bg-subtle"><X className="size-4" /></button>
    </header>
    <div className="flex shrink-0 gap-2 border-b border-line px-4 py-2" role="group" aria-label={t("Asistan modu", "Assistant mode")}>
      {(["company", "guide"] as const).map(value => <button key={value} type="button" aria-pressed={mode === value} onClick={() => { clear(); setMode(value); setConsent(false); }} className={`rounded-full px-3 py-1.5 text-xs ${mode === value ? "bg-brand-soft font-semibold text-brand" : "text-muted hover:bg-subtle"}`}>{value === "company" ? t("Şirketim", "My company") : t("Kullanım rehberi", "Workflow guide")}</button>)}
    </div>
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
      {!messages.length && <div className="space-y-4"><div><p className="text-base font-semibold">{mode === "company" ? t("Şirketine özel, kaynaklarıyla birlikte.", "Company-specific, with sources.") : t("Günlük işlerini kolaylaştır.", "Simplify your daily workflow.")}</p>
        <p className="mt-2 text-xs leading-6 text-muted">{mode === "company" ? t("Yayınlanan rehberleri ve ürün stoklarını ararım; stok eksikleri için mevcut siparişleri ve depolar arası transferi değerlendiririm. Yerel arama ücretsiz ve kotasızdır.", "I search published guides and product stock, and consider incoming purchases and warehouse transfers. Local retrieval is free with no AI quota.") : t("Uygulamanın kullanımını açıklarım. Bulut açıklamasını açarsan mesajların sağlayıcıya gönderilir.", "I explain application workflows. Enabling cloud explanations sends your messages to the provider.")}</p></div>
        {ready && <div className="flex flex-wrap gap-2">{suggestions.map(prompt => <button type="button" key={prompt} disabled={busy} onClick={() => { setDraft(prompt); input.current?.focus(); }} className="rounded-xl border border-line bg-subtle px-3 py-2 text-left text-xs leading-5 hover:border-brand/40 disabled:opacity-50">{prompt}</button>)}</div>}
      </div>}
      {configuration.isFetching && <p role="status" className="mt-4 text-xs text-muted">{t("Asistan kontrol ediliyor…", "Checking assistant…")}</p>}
      {configuration.isError && <div role="alert" className="mt-4 text-xs text-danger">{getErrorMessage(configuration.error)} <button type="button" className="underline" onClick={() => void configuration.refetch()}>{t("Tekrar dene", "Retry")}</button></div>}
      <div role="log" aria-live="polite" aria-relevant="additions" aria-label={t("Sohbet mesajları", "Chat messages")} className="space-y-5">
        {messages.map((message, index) => <article key={index} className={message.role === "user" ? "ml-8 mt-4 rounded-2xl rounded-br-sm bg-brand-soft px-4 py-3" : "pt-3"}>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted">{message.role === "user" ? t("Sen", "You") : `Invo · ${message.reply?.mode === "local" ? t("Yerel kaynaklar", "Local sources") : t("Bulut AI", "Cloud AI")}`}</p>
          {message.reply && <ReplyNotice reply={message.reply} />}
          <p className="whitespace-pre-wrap break-words text-sm leading-6">{message.text}</p>
          {message.reply?.truncated && <p className="mt-2 text-xs text-muted">{t("Yanıt uzunluk sınırına ulaştı.", "The response reached its length limit.")}</p>}
          {!!message.reply?.sources?.length && <div className="mt-3 space-y-2 rounded-xl border border-line p-3"><p className="text-[10px] font-semibold uppercase text-muted">{t("Getirilen kaynaklar", "Retrieved sources")}</p>{message.reply.sources.map(source => <Link key={source.key} href={source.href} onClick={onClose} className="flex items-center gap-2 text-xs text-brand"><BookOpen className="size-3 shrink-0" /><span>[{source.key}] {source.title}{source.revision != null && ` · r${source.revision}`}</span></Link>)}</div>}
          {message.reply?.retrievedAtUtc && <p className="mt-2 text-[10px] text-muted">{t("Veri zamanı", "Retrieved")}: {formatDate(message.reply.retrievedAtUtc)}</p>}
          {message.role === "assistant" && <CopyAnswer text={message.text} />}
        </article>)}
        {busy && <div role="status" className="mt-4 flex items-center gap-2 text-xs text-muted"><LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" />{t("Invo inceliyor…", "Invo is reviewing…")}</div>}
      </div>
      {error && <p role="alert" className="mt-4 rounded-xl bg-danger-soft p-3 text-xs text-danger">{error}</p>}<div ref={end} />
    </div>
    <footer className="shrink-0 space-y-3 border-t border-line bg-surface px-4 pb-4 pt-3">
      {!!cloudAvailable && <label htmlFor={consentId} className="flex items-start gap-2 text-[10px] leading-4 text-muted"><input id={consentId} type="checkbox" className="mt-0.5" checked={consent} onChange={e => setConsent(e.target.checked)} /><span>{mode === "company"
        ? t("Bulut AI açıklaması: mesajlarımı ve seçilen şirket kaynaklarını Groq'ya göndermeyi kabul ediyorum. Gizli/kişisel veri paylaşmadan önce şirket politikanı kontrol et.", "Cloud AI explanation: I agree to send my messages and selected company sources to Groq. Check company policy before sharing confidential/personal data.")
        : configuration.data?.provider === "Groq" ? t("Mesajlarımı Groq'ya göndererek bulut açıklamasını aç.", "Enable cloud explanations by sending my messages to Groq.")
          : t("Mesajlarımı Google Gemini'ye göndermeyi kabul ediyorum. Ücretsiz hizmette ürün geliştirmesinde kullanılabilir; gizli, hassas veya kişisel bilgi göndermeyeceğim.", "I agree to send messages to Google Gemini. Free services may use them for product improvement; I will not submit confidential, sensitive or personal information.")}</span></label>}
      {mode === "company" && !cloudAvailable && <p className="text-[10px] leading-4 text-muted">{t("Yerel kaynak araması etkin. Serbest biçimli RAG açıklamaları Groq anahtarı eklendiğinde açılabilir; şirket verileri Gemini'ye gönderilmez.", "Local retrieval is active. Free-form RAG explanations can be enabled with a Groq key; company data is not sent to Gemini.")}</p>}
      <form onSubmit={event => { event.preventDefault(); void send(); }} className="rounded-xl border border-line bg-subtle p-2 focus-within:border-brand/60">
        <textarea ref={input} aria-label={t("Invo'ya mesaj", "Message Invo")} maxLength={maxLength} rows={2} value={draft} disabled={!ready || busy || waiting > 0}
          placeholder={mode === "company" ? t("Ürün adı, SKU veya belge konusu sor…", "Ask a product name, SKU or document topic…") : t("İş akışı hakkında sor…", "Ask about a workflow…")}
          onChange={event => setDraft(event.target.value)} onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void send(); } }}
          className="max-h-28 w-full resize-none bg-transparent px-2 py-1 text-sm leading-6 outline-none placeholder:text-muted/70 disabled:opacity-50" />
        <div className="flex items-center justify-between gap-2 px-1"><span className="text-[10px] text-muted">{waiting > 0 ? t(`${waiting} sn sonra dene`, `Retry in ${waiting}s`) : `${draft.length}/${maxLength}`}</span>
          {busy ? <Button type="button" variant="ghost" className="min-h-8 px-2 py-1 text-xs" onClick={() => request.current?.abort()}><Square className="size-3" />{t("Durdur", "Stop")}</Button>
            : <Button type="submit" aria-label={t("Mesaj gönder", "Send message")} className="min-h-8 px-3 py-1 text-xs" disabled={!ready || !draft.trim() || waiting > 0}><Send className="size-3.5" />{t("Gönder", "Send")}</Button>}
        </div>
      </form>
      <p className="flex items-start gap-1.5 text-[10px] leading-4 text-muted"><ShieldCheck className="mt-0.5 size-3 shrink-0" /><span>{t("Yalnızca seçili şirket. Belgeler yayınlanmış olmalı. İşlem yapmaz; öneriler onay gerektirir. Sohbet yalnızca bu sekmenin belleğinde tutulur.", "Selected company only. Published documents only. No actions; recommendations need review. Chat stays in this tab's memory only.")}</span></p>
    </footer>
  </section>;
}
