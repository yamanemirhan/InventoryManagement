"use client";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { useCompany, useCompanyText } from "@/features/companies/company-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

type Point = { timestamp: number; value: number };
type Overview = {
  collectedAtUtc: string; environment: string; grafanaPath: string; diagnosticsEnabled: boolean;
  metrics: { name: string; value: number | null; unit: string }[];
  series: { name: string; points: Point[] }[];
  containers: { name: string; cpuPercent: number | null; memoryBytes: number | null; memoryLimitBytes: number | null; healthy: boolean }[];
  alerts: { name: string; state: string; severity: string; summary: string }[];
};
type Log = { timestamp: string; level: string; message: string; traceId: string | null };
type Trace = { traceId: string; spans: { name: string; service: string; durationMs: number; error: boolean }[] };
type Diagnostic = { scenario: string; traceId: string; outcome: string; completedAtUtc: string };

function Sparkline({ points, label }: { points: Point[]; label: string }) {
  if (points.length < 2) return <p className="mt-3 text-xs text-muted">—</p>;
  const max = Math.max(...points.map(p => p.value), 0.001);
  const line = points.map((p, i) => `${(i / (points.length - 1)) * 220},${45 - (p.value / max) * 40}`).join(" ");
  return <svg role="img" aria-label={label} viewBox="0 0 220 50" className="mt-3 h-12 w-full text-brand"><polyline points={line} fill="none" stroke="currentColor" strokeWidth="2" /></svg>;
}
function formatted(value: number | null | undefined, unit = "") {
  if (value == null) return "—";
  if (unit === "bytes") return `${(value / 1048576).toFixed(0)} MB`;
  if (unit === "bytes/s") return `${(value / 1024).toFixed(1)} KB/s`;
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${unit}`;
}

export function MonitoringPage() {
  const t = useCompanyText(); const { session } = useCompany();
  const allowed = !!session?.platformAdmin;
  const [level, setLevel] = useState("all"); const [traceInput, setTraceInput] = useState(""); const [traceId, setTraceId] = useState("");
  const query = useQuery({ queryKey: ["admin-monitoring"], enabled: allowed,
    queryFn: ({ signal }) => apiClient<Overview>("/api/admin/monitoring", { signal }), refetchInterval: 30000, retry: false });
  const logs = useQuery({ queryKey: ["admin-logs", level, traceId], enabled: allowed,
    queryFn: ({ signal }) => apiClient<Log[]>(`/api/admin/monitoring/logs?level=${level}${traceId ? `&traceId=${traceId}` : ""}`, { signal }), refetchInterval: 30000, retry: false });
  const trace = useQuery({ queryKey: ["admin-trace", traceId], enabled: allowed && !!traceId,
    queryFn: ({ signal }) => apiClient<Trace>(`/api/admin/monitoring/traces/${traceId}`, { signal }), retry: false });
  const diagnostic = useMutation({ mutationFn: (scenario: string) => apiClient<Diagnostic>("/api/admin/monitoring/diagnostics", { method: "POST", body: { scenario } }),
    onSuccess: result => { setTraceInput(result.traceId); setTraceId(result.traceId); } });
  if (!allowed) return <p role="alert">{t("Bu ekran yalnızca platform yöneticisine açıktır.", "This screen is for platform administrators only.")}</p>;
  const data = query.data;
  const value = (name: string) => data?.metrics.find(m => m.name === name);
  const cards = [
    ["cpu", "CPU", "%"], ["memory", t("RAM", "Memory"), "%"], ["disk", t("Disk", "Disk"), "%"],
    ["requests", t("İstek / saniye", "Requests / second"), "/s"], ["errors", t("5xx hata oranı", "5xx error rate"), "%"],
    ["latencyP95", t("Gecikme p95", "Latency p95"), "s"], ["realtimePending", t("Bekleyen canlı olay", "Pending realtime events"), ""],
    ["emailPending", t("Bekleyen e-posta", "Pending emails"), ""], ["emailRetried", t("E-posta tekrarı", "Retried emails"), ""],
    ["lowStock", t("Düşük stok satırı", "Low-stock rows"), ""], ["networkReceive", t("Ağ indirme", "Network receive"), "bytes/s"],
    ["networkTransmit", t("Ağ yükleme", "Network transmit"), "bytes/s"],
  ];
  return <div className="space-y-6">
    <header className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-2xl font-semibold">{t("Sistem izleme", "System monitoring")}</h1>
      <p className="mt-2 text-sm text-muted">{t("Sunucu kaynakları ve uygulama sağlığı · 30 saniyede yenilenir", "Server resources and application health · refreshes every 30 seconds")}</p>
      {data && <p className="mt-1 text-xs text-muted">{data.environment} · {new Date(data.collectedAtUtc).toLocaleString()}</p>}</div>
      <div className="flex gap-3"><Button variant="secondary" onClick={() => { void query.refetch(); void logs.refetch(); }}>{t("Yenile", "Refresh")}</Button>
        <a href="https://inventory-yamanemirhan.duckdns.org/observability/" target="_blank" rel="noopener noreferrer" className="self-center text-sm text-brand">Grafana ↗</a></div>
    </header>
    {query.isPending && <p role="status">{t("Ölçümler alınıyor…", "Fetching metrics…")}</p>}
    {query.error && <p role="alert" className="panel p-4 text-danger">{query.error.message}</p>}
    {data && <>
      <section className="panel space-y-2 p-5"><h2 className="font-semibold">{t("Aktif uyarılar", "Active alerts")}</h2>
        {data.alerts.length === 0 ? <p className="text-sm text-muted">{t("Şu anda aktif uyarı yok.", "No active alerts.")}</p> : data.alerts.map((a, i) => <p key={`${a.name}-${i}`} role="status" className={a.severity === "critical" ? "text-danger" : "text-brand"}>{a.name} · {a.state} · {a.summary}</p>)}
        {value("businessCollector")?.value !== 1 && <p className="text-danger">{t("İş ölçümleri güncel olmayabilir. Toplayıcı sağlığını kontrol edin.", "Business metrics may be stale. Check collector health.")}</p>}
      </section>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([name, label, unit]) => <article key={name} className="panel p-5"><h2 className="text-sm text-muted">{label}</h2>
        <p className="mt-2 text-2xl font-semibold">{formatted(value(name)?.value, unit)}</p><Sparkline points={data.series.find(s => s.name === name)?.points ?? []} label={`${label} · 15 min`} /></article>)}</section>
      <p className="text-xs text-muted">{t("Kaynaklar sunucunun toplamını; iş ölçümleri bu ortamın toplamını gösterir. — veri henüz yok demektir, sıfır demek değildir. p95: isteklerin %95’inin tamamlandığı süre.", "Resources cover the whole server; business metrics cover this environment. — means no data yet, not zero. p95 is the duration within which 95% of requests finish.")}</p>
      <section className="panel overflow-x-auto p-5"><h2 className="mb-4 font-semibold">{t("Konteynerler", "Containers")}</h2><table className="w-full text-left text-sm"><thead><tr><th>{t("Servis", "Service")}</th><th>CPU</th><th>RAM</th><th>{t("Limit", "Limit")}</th><th>{t("Sağlık", "Health")}</th></tr></thead><tbody>{data.containers.map(c => <tr key={c.name} className="border-t border-line"><td className="py-3 pr-4">{c.name}</td><td>{formatted(c.cpuPercent, "%")}</td><td>{formatted(c.memoryBytes, "bytes")}</td><td>{formatted(c.memoryLimitBytes, "bytes")}</td><td>{c.healthy ? "✓" : t("Kontrol et", "Inspect")}</td></tr>)}</tbody></table></section>
    </>}
    <section className="panel space-y-4 p-5"><h2 className="font-semibold">{t("Loglar ve istek izleri", "Logs and traces")}</h2>
      <div className="flex flex-wrap gap-3"><select aria-label="Log level" className="field" value={level} onChange={e => setLevel(e.target.value)}><option value="all">{t("Tüm seviyeler", "All levels")}</option><option value="warning">Warning</option><option value="error">Error</option></select>
        <Input placeholder="Trace ID (32 hex)" aria-label="Trace ID" value={traceInput} maxLength={32} onChange={e => setTraceInput(e.target.value)} />
        <Button disabled={!!traceInput && !/^[a-f0-9]{32}$/.test(traceInput)} onClick={() => setTraceId(traceInput)}>{t("İzi bul", "Find trace")}</Button>
        <Button variant="ghost" onClick={() => { setTraceId(""); setTraceInput(""); }}>{t("Temizle", "Clear")}</Button></div>
      <p className="text-xs text-muted">{t("Son 1 saatteki en yeni 100 log. Export birkaç saniye gecikebilir. Hata cevabındaki traceId veya X-Request-Id ile arayın.", "Latest 100 logs from the last hour. Export may take a few seconds. Search using the error response traceId or X-Request-Id.")}</p>
      {logs.error && <p role="alert" className="text-danger">{logs.error.message}</p>}
      {logs.data?.length === 0 && <p className="text-sm text-muted">{t("Bu filtrede log yok.", "No logs match this filter.")}</p>}
      <div className="max-h-96 space-y-3 overflow-y-auto">{logs.data?.map((log, i) => <article key={`${log.timestamp}-${i}`} className="border-t border-line pt-3"><p className="text-xs text-muted">{new Date(log.timestamp).toLocaleString()} · {log.level}</p><pre className="mt-1 whitespace-pre-wrap break-all text-xs">{log.message}</pre>{log.traceId && <button className="mt-1 break-all text-xs text-brand" onClick={() => { setTraceId(log.traceId!); setTraceInput(log.traceId!); }}>{log.traceId}</button>}</article>)}</div>
      {traceId && <div className="border-t border-line pt-4"><h3 className="font-medium">Trace · {traceId}</h3>{trace.error && <p role="alert">{trace.error.message} <Button variant="ghost" onClick={() => void trace.refetch()}>{t("Tekrar dene", "Retry")}</Button></p>}{trace.data?.spans.map((s, i) => <div key={i} className="my-3"><p className={`text-sm ${s.error ? "text-danger" : ""}`}>{s.name} · {s.durationMs.toFixed(1)} ms {s.error && "· ERROR"}</p><div className="mt-1 h-1 rounded bg-brand" style={{ width: `${Math.max(2, s.durationMs / Math.max(...trace.data!.spans.map(x => x.durationMs), 1) * 100)}%` }} /></div>)}</div>}
    </section>
    {data?.diagnosticsEnabled && <section className="panel space-y-4 p-5"><h2 className="font-semibold">{t("Güvenli teşhis provası", "Safe diagnostic drill")}</h2>
      <p className="text-sm text-muted">{t("Yalnızca bu istek için gecikme veya yapay bağımlılık hatası oluşturur, ardından gerçek veritabanı bağlantısını kontrol ederek toparlanmayı kaydeder. Veri değiştirmez; servisleri durdurmaz. Dakikada bir çalışır.", "Simulates latency or a dependency failure in this request, then checks the real database and records recovery. No data changes or service shutdowns. Once per minute.")}</p>
      <div className="flex flex-wrap gap-3"><Button disabled={diagnostic.isPending} onClick={() => diagnostic.mutate("dependency_failure")}>{t("Hata → toparlanma", "Failure → recovery")}</Button><Button variant="secondary" disabled={diagnostic.isPending} onClick={() => diagnostic.mutate("slow_dependency")}>{t("Gecikmeyi incele", "Inspect latency")}</Button></div>
      {diagnostic.error && <p role="alert">{diagnostic.error.message}</p>}{diagnostic.data && <p role="status" className="break-all text-sm">{diagnostic.data.outcome} · {diagnostic.data.traceId} · {t("Birkaç saniye sonra logları yenileyin ve izi açın.", "Refresh logs and open the trace after a few seconds.")}</p>}
    </section>}
    <Link href="/admin/monitoring/guide" className="text-sm text-brand">{t("Log, trace ve metric nasıl okunur? →", "How to read logs, traces and metrics →")}</Link>
  </div>;
}
