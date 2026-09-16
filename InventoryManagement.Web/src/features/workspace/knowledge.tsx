"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, ArrowRight } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import {
  useCompany,
  useCompanyText,
} from "@/features/companies/company-provider";
import { useI18n } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LinkButton } from "@/components/ui/link-button";
import { Pagination } from "@/components/ui/pagination";
import { ErrorState, LoadingState, EmptyState } from "@/components/ui/states";
import { AdminOnly } from "@/features/auth/components/access";

type Document = {
  id: string;
  title: string;
  content: string;
  status: string;
  revision: number;
  createdAtUtc: string;
  updatedAtUtc: string;
};
function useStatusLabel() {
  const t = useCompanyText();
  return (status: string) =>
    ({
      Draft: t("Taslak", "Draft"),
      Published: t("Yayında", "Published"),
      Archived: t("Arşiv", "Archived"),
    })[status] ?? status;
}
export function KnowledgeList() {
  const t = useCompanyText();
  const label = useStatusLabel();
  const { company } = useCompany();
  const { formatDate } = useI18n();
  const [page, setPage] = useState(1);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const query = useQuery({
    queryKey: ["knowledge", company?.id, page, search],
    queryFn: () =>
      apiClient<{
        items: Omit<Document, "content" | "createdAtUtc">[];
        totalCount: number;
      }>(`/api/knowledge?page=${page}&search=${encodeURIComponent(search)}`),
  });
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-brand">
            {company?.name}
          </p>
          <h1 className="mt-2 text-2xl font-semibold">
            {t("Bilgi kaynakları", "Knowledge resources")}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {t(
              "Çalışma rehberlerini, depo kurallarını ve ürün notlarını ekibinizle paylaşın.",
              "Share operating guides, warehouse rules and product notes with your team.",
            )}
          </p>
        </div>
        <AdminOnly>
          <LinkButton href="/knowledge/new">
            {t("Kaynak ekle", "Add resource")}
          </LinkButton>
        </AdminOnly>
      </header>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSearch(input.trim());
          setPage(1);
        }}
        className="flex gap-3"
      >
        <Input
          aria-label={t("Başlığa göre ara", "Search titles")}
          placeholder={t("Başlığa göre ara…", "Search titles…")}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={200}
        />
        <Button variant="secondary">{t("Ara", "Search")}</Button>
      </form>
      {query.isPending ? (
        <LoadingState />
      ) : query.error ? (
        <ErrorState
          message={query.error.message}
          onRetry={() => void query.refetch()}
        />
      ) : query.data.items.length === 0 ? (
        <EmptyState
          title={t("Kaynak bulunamadı", "No resources found")}
          description={t(
            "Yayınlanan kaynaklar tüm şirket üyelerine görünür. Taslak ve arşivleri yalnızca yöneticiler görebilir.",
            "Published resources are visible to all company members. Only managers can see drafts and archives.",
          )}
        />
      ) : (
        <section className="panel divide-y divide-line">
          {query.data.items.map((d) => (
            <Link
              href={`/knowledge/${d.id}`}
              key={d.id}
              className="flex items-center gap-4 p-5 hover:bg-subtle"
            >
              <BookOpen className="shrink-0 text-brand" size={22} />
              <div className="min-w-0 flex-1">
                <h2 className="break-words font-semibold">{d.title}</h2>
                <p className="mt-1 text-xs text-muted">
                  {label(d.status)} · {t("Sürüm", "Version")} {d.revision} ·{" "}
                  {formatDate(d.updatedAtUtc)}
                </p>
              </div>
              <ArrowRight size={18} className="shrink-0 text-muted" />
            </Link>
          ))}
          <Pagination
            page={page}
            pageSize={20}
            total={query.data.totalCount}
            onChange={setPage}
          />
        </section>
      )}
    </div>
  );
}
export function KnowledgeDetail({ id }: { id: string }) {
  const t = useCompanyText();
  const label = useStatusLabel();
  const { company } = useCompany();
  const { formatDate } = useI18n();
  const [editing, setEditing] = useState(false);
  const query = useQuery({
    queryKey: ["knowledge-document", company?.id, id],
    queryFn: () => apiClient<Document>(`/api/knowledge/${id}`),
  });
  if (query.isPending) return <LoadingState />;
  if (query.error)
    return (
      <ErrorState
        message={query.error.message}
        onRetry={() => void query.refetch()}
      />
    );
  const d = query.data;
  if (editing && company && ["Owner", "Manager"].includes(company.role))
    return (
      <KnowledgeForm
        document={d}
        onCancel={() => setEditing(false)}
        onSaved={() => setEditing(false)}
      />
    );
  return (
    <div className="space-y-6">
      <LinkButton secondary href="/knowledge">
        {t("Bilgi kaynaklarına dön", "Back to resources")}
      </LinkButton>
      <article className="panel p-6 sm:p-9">
        <header className="mb-7 flex flex-wrap items-start justify-between gap-4 border-b border-line pb-6">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-brand">
              {label(d.status)} · {t("Sürüm", "Version")} {d.revision}
            </p>
            <h1 className="mt-3 break-words text-2xl font-semibold">
              {d.title}
            </h1>
            <p className="mt-3 text-xs text-muted">
              {t("Son güncelleme", "Last updated")}:{" "}
              {formatDate(d.updatedAtUtc)}
            </p>
          </div>
          <AdminOnly>
            <Button variant="secondary" onClick={() => setEditing(true)}>
              {t("Düzenle", "Edit")}
            </Button>
          </AdminOnly>
        </header>
        <div className="whitespace-pre-wrap break-words text-sm leading-7">
          {d.content}
        </div>
      </article>
    </div>
  );
}
export function KnowledgeForm({
  document: doc,
  onCancel,
  onSaved,
}: {
  document?: Document;
  onCancel?: () => void;
  onSaved?: () => void;
}) {
  const t = useCompanyText();
  const label = useStatusLabel();
  const router = useRouter();
  const cache = useQueryClient();
  const [baseRevision] = useState(doc?.revision);
  const [title, setTitle] = useState(doc?.title ?? "");
  const [content, setContent] = useState(doc?.content ?? "");
  const [status, setStatus] = useState(doc?.status ?? "Draft");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await apiClient<{ id: string } | undefined>(
        doc ? `/api/knowledge/${doc.id}` : "/api/knowledge",
        {
          method: doc ? "PUT" : "POST",
          body: {
            title: title.trim(),
            content: content.trim(),
            status,
            ...(doc ? { id: doc.id, revision: baseRevision } : {}),
          },
        },
      );
      await cache.invalidateQueries({ queryKey: ["knowledge"] });
      await cache.invalidateQueries({ queryKey: ["knowledge-document"] });
      await cache.invalidateQueries({ queryKey: ["dashboard"] });
      await cache.invalidateQueries({ queryKey: ["activity"] });
      if (doc) onSaved?.();
      else if (result) router.push(`/knowledge/${result.id}`);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : t("Kaydedilemedi.", "Unable to save."),
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={save} className="panel space-y-6 p-6 sm:p-8">
      <header>
        <h1 className="text-2xl font-semibold">
          {doc
            ? t("Kaynağı düzenle", "Edit resource")
            : t("Yeni bilgi kaynağı", "New knowledge resource")}
        </h1>
        <p className="mt-2 text-sm text-muted">
          {t(
            "İçeriği düz metin olarak yazın. Yayınladığınızda şirket üyeleri okuyabilir.",
            "Write in plain text. Company members can read the resource once it is published.",
          )}
        </p>
      </header>
      <label className="block space-y-2 text-sm">
        {t("Başlık", "Title")}
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={200}
          disabled={busy}
        />
      </label>
      <label className="block space-y-2 text-sm">
        {t("İçerik", "Content")}
        <textarea
          className="field min-h-[320px] resize-y leading-7"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          maxLength={30000}
          disabled={busy}
        />
        <span className="block text-right text-xs text-muted">
          {content.length} / 30000
        </span>
      </label>
      <label className="block max-w-xs space-y-2 text-sm">
        {t("Durum", "Status")}
        <select
          className="field"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          disabled={busy}
        >
          {["Draft", "Published", "Archived"].map((s) => (
            <option key={s} value={s}>
              {label(s)}
            </option>
          ))}
        </select>
      </label>
      <p className="text-xs text-muted">
        {t(
          "Arşivlenen içerik saklanır; ekip üyelerinin okuma listesinden kaldırılır. Güncellemeler yeni bir sürüm numarası alır.",
          "Archived content is retained and removed from the team's reading list. Each update receives a new version number.",
        )}
      </p>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <div className="flex gap-3">
        <Button disabled={busy || !title.trim() || !content.trim()}>
          {busy ? t("Kaydediliyor…", "Saving…") : t("Kaydet", "Save")}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={busy}
          onClick={() => (onCancel ? onCancel() : router.push("/knowledge"))}
        >
          {t("Vazgeç", "Cancel")}
        </Button>
      </div>
    </form>
  );
}
