"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { MembersPanel } from "./company-page";
import { useCompany, useCompanyText } from "./company-provider";
type Company = {
  id: string;
  name: string;
  isActive: boolean;
  memberCount: number;
};
type AdminData = {
  companies: Company[];
  users: {
    subjectId: string;
    name: string;
    email: string;
    companyCount: number;
  }[];
};
export function AdminPage() {
  const t = useCompanyText();
  const { session, switchCompany } = useCompany();
  const [selected, setSelected] = useState<string>();
  const [editing, setEditing] = useState<Company | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const query = useQuery({
    queryKey: ["platform-admin"],
    enabled: !!session?.platformAdmin,
    queryFn: () => apiClient<AdminData>("/companies/admin"),
  });
  async function save() {
    if (!editing) return;
    setPending(true);
    setError("");
    try {
      await apiClient(`/companies/${editing.id}`, {
        method: "PATCH",
        body: editing,
      });
      window.location.reload();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : t("İşlem başarısız.", "Request failed."),
      );
      setEditing(null);
      setPending(false);
    }
  }
  if (!session?.platformAdmin)
    return <p>{t("Erişim reddedildi.", "Access denied.")}</p>;
  return (
    <div className="space-y-6">
      <header>
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-brand">
          {t("Platform yönetimi", "Platform administration")}
        </p>
        <h1 className="text-2xl font-semibold">
          {t("Şirketler ve kullanıcılar", "Companies & users")}
        </h1>
        <p className="mt-2 text-sm text-muted">
          {t(
            "Şirketleri ve ekipleri yönetin. Envanteri yönetmek için ilgili şirketin çalışma alanını açın.",
            "Manage companies and teams. Open a company's workspace to manage its inventory.",
          )}
        </p>
      </header>
      {query.isPending && <p role="status">{t("Yükleniyor…", "Loading…")}</p>}
      {query.error && (
        <div role="alert">
          {query.error.message}
          <Button onClick={() => void query.refetch()}>
            {t("Tekrar dene", "Retry")}
          </Button>
        </div>
      )}
      {error && (
        <p role="alert" className="text-danger">
          {error}
        </p>
      )}
      {query.data && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="panel p-6">
              <p className="text-sm text-muted">{t("Şirket", "Companies")}</p>
              <p className="mt-2 text-3xl font-semibold">
                {query.data.companies.length}
              </p>
            </div>
            <div className="panel p-6">
              <p className="text-sm text-muted">
                {t(
                  "Uygulamaya giriş yapmış kullanıcı",
                  "Users who have signed in",
                )}
              </p>
              <p className="mt-2 text-3xl font-semibold">
                {query.data.users.length}
              </p>
            </div>
          </div>
          <section className="panel divide-y divide-line px-6">
            {query.data.companies.length === 0 && (
              <p className="py-6">
                {t("Henüz şirket yok.", "No companies yet.")}
              </p>
            )}
            {query.data.companies.map((c) => (
              <div
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-4 py-5"
              >
                <div>
                  <h2 className="font-semibold">{c.name}</h2>
                  <p className="text-sm text-muted">
                    {c.memberCount} {t("üye", "members")} ·{" "}
                    {c.isActive ? t("Aktif", "Active") : t("Pasif", "Inactive")}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    disabled={!c.isActive}
                    onClick={() => switchCompany(c.id)}
                  >
                    {t("Çalışma alanını aç", "Open workspace")}
                  </Button>
                  <Button variant="secondary" onClick={() => setSelected(c.id)}>
                    {t("Ekibi yönet", "Manage team")}
                  </Button>
                  <Button variant="ghost" onClick={() => setEditing({ ...c })}>
                    {t("Düzenle", "Edit")}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setEditing({ ...c, isActive: !c.isActive })}
                  >
                    {c.isActive
                      ? t("Pasife al", "Deactivate")
                      : t("Etkinleştir", "Activate")}
                  </Button>
                </div>
              </div>
            ))}
          </section>
          {selected && (
            <div className="space-y-3">
              <h2 className="font-semibold">
                {query.data.companies.find((c) => c.id === selected)?.name}
              </h2>
              <MembersPanel key={selected} companyId={selected} />
            </div>
          )}
          <section className="panel space-y-4 p-6">
            <h2 className="font-semibold">
              {t("Kullanıcı dizini", "User directory")}
            </h2>
            <p className="text-sm text-muted">
              {t(
                "Giriş yapan hesaplar burada görünür. Şifre ve platform Admin rolü mevcut kimlik yönetim sisteminden yönetilir.",
                "Accounts appear after signing in. Passwords and the platform Admin role are managed through the existing identity system.",
              )}
            </p>
            {query.data.users.map((u) => (
              <div key={u.subjectId} className="border-t border-line pt-4">
                <p className="font-medium">{u.name}</p>
                <p className="text-sm text-muted">
                  {u.email} · {u.companyCount} {t("şirket", "companies")}
                </p>
                <code className="select-all break-all text-xs text-muted">
                  {u.subjectId}
                </code>
              </div>
            ))}
          </section>
        </>
      )}
      {editing && (
        <>
          <div className="panel space-y-3 p-5">
            <label className="block text-sm">
              {t("Şirket adı", "Company name")}
              <Input
                value={editing.name}
                onChange={(e) =>
                  setEditing({ ...editing, name: e.target.value })
                }
                maxLength={200}
              />
            </label>
            <Button
              onClick={() => void save()}
              disabled={pending || editing.name.trim().length < 2}
            >
              {t("Kaydet", "Save")}
            </Button>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              {t("Vazgeç", "Cancel")}
            </Button>
          </div>
          {editing.isActive !==
            query.data?.companies.find((c) => c.id === editing.id)
              ?.isActive && (
            <ConfirmDialog
              description={
                editing.isActive
                  ? t(
                      "Şirket yeniden erişime açılsın mı?",
                      "Reactivate this company?",
                    )
                  : t(
                      "Şirket pasife alınsın mı? Üyeler envantere erişemeyecek; veriler korunacak.",
                      "Deactivate this company? Members lose inventory access; data is preserved.",
                    )
              }
              pending={pending}
              onConfirm={() => void save()}
              onClose={() => setEditing(null)}
            />
          )}
        </>
      )}
    </div>
  );
}
