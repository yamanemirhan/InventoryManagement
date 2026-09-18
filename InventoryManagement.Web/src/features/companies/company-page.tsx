"use client";
import { Invitations } from "@/features/operations/invitations";
import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2, UsersRound, ShieldCheck } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useCompany, useCompanyText } from "./company-provider";

const roles = ["Owner", "Manager", "Operator", "Viewer"];
export function useRoleLabel() {
  const t = useCompanyText();
  return (role: string) =>
    ({
      Owner: t("Sahip", "Owner"),
      Manager: t("Yönetici", "Manager"),
      Operator: t("Operatör", "Operator"),
      Viewer: t("İzleyici", "Viewer"),
    })[role] ?? role;
}
type Member = {
  id: string;
  subjectId: string;
  name: string;
  email: string;
  role: string;
};
export function MembersPanel({ companyId }: { companyId: string }) {
  const t = useCompanyText();
  const label = useRoleLabel();
  const [subject, setSubject] = useState("");
  const [role, setRole] = useState("Viewer");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [remove, setRemove] = useState<Member | null>(null);
  const query = useQuery({
    queryKey: ["company-members", companyId],
    queryFn: () => apiClient<Member[]>(`/api/companies/${companyId}/members`),
  });
  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await apiClient(`/api/companies/${companyId}/members`, {
        method: "PUT",
        body: { subjectId: subject.trim(), role },
      });
      setSubject("");
      setNotice(t("Üyelik kaydedildi.", "Membership saved."));
      await query.refetch();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : t("İşlem başarısız.", "Request failed."),
      );
    } finally {
      setBusy(false);
    }
  }
  async function removeMember() {
    if (!remove) return;
    setBusy(true);
    setError("");
    try {
      await apiClient(`/api/companies/${companyId}/members/${remove.id}`, {
        method: "DELETE",
      });
      setRemove(null);
      await query.refetch();
    } catch (e) {
      setRemove(null);
      setError(
        e instanceof Error
          ? e.message
          : t("İşlem başarısız.", "Request failed."),
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel space-y-5 p-6">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <UsersRound size={20} />
        {t("Ekip üyeleri", "Team members")}
      </h2>
      <p className="text-sm text-muted">
        {t(
          "Üye önce uygulamaya giriş yapmalı. Şirket ve ekip ekranındaki hesap kimliğini kullanın. Mevcut üyeyi seçerek rolünü değiştirebilirsiniz.",
          "Members must first sign in. Use the account ID from their Company & team page. Select an existing member to change their role.",
        )}
      </p>
      {query.isPending && <p role="status">{t("Yükleniyor…", "Loading…")}</p>}
      {query.error && (
        <div role="alert">
          {query.error.message}
          <Button variant="secondary" onClick={() => void query.refetch()}>
            {t("Tekrar dene", "Retry")}
          </Button>
        </div>
      )}
      <div className="divide-y divide-line">
        {query.data?.map((member) => (
          <div
            key={member.id}
            className="flex flex-wrap items-center justify-between gap-3 py-4"
          >
            <div className="min-w-0">
              <p className="font-medium">
                {member.name || member.email || member.subjectId}
              </p>
              <p className="break-all text-sm text-muted">{member.email}</p>
              <p className="text-xs text-muted">{label(member.role)}</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                disabled={busy}
                onClick={() => {
                  setSubject(member.subjectId);
                  setRole(member.role);
                }}
              >
                {t("Rolü düzenle", "Edit role")}
              </Button>
              <Button
                variant="ghost"
                disabled={busy}
                onClick={() => setRemove(member)}
              >
                {t("Çıkar", "Remove")}
              </Button>
            </div>
          </div>
        ))}
      </div>
      <form
        onSubmit={save}
        className="grid items-end gap-3 sm:grid-cols-[1fr_160px_auto]"
      >
        <label className="space-y-2 text-sm">
          {t("Hesap kimliği", "Account ID")}
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            maxLength={200}
            disabled={busy}
          />
        </label>
        <label className="space-y-2 text-sm">
          {t("Şirket rolü", "Company role")}
          <select
            className="field"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            disabled={busy}
          >
            {roles.map((r) => (
              <option key={r} value={r}>
                {label(r)}
              </option>
            ))}
          </select>
        </label>
        <Button disabled={busy || !subject.trim()}>
          {t("Üyeliği kaydet", "Save membership")}
        </Button>
      </form>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="text-sm">
          {notice}
        </p>
      )}
      {remove && (
        <ConfirmDialog
          description={t(
            `${remove.name || remove.subjectId} şirketten çıkarılsın mı?`,
            `Remove ${remove.name || remove.subjectId} from this company?`,
          )}
          pending={busy}
          onConfirm={() => void removeMember()}
          onClose={() => setRemove(null)}
        />
      )}
    </section>
  );
}
export function CompanyPage() {
  const { session, company } = useCompany();
  const t = useCompanyText();
  const label = useRoleLabel();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function create(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const created = await apiClient<{ id: string }>("/api/companies", {
        method: "POST",
        body: { name: name.trim() },
      });
      sessionStorage.setItem("inventory-company", created.id);
      // Reset all inventory state when entering the newly created company.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/");
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : t("İşlem başarısız.", "Request failed."),
      );
      setBusy(false);
    }
  }
  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-brand">
          {t("Çalışma alanınız", "Your workspace")}
        </p>
        <h1 className="text-2xl font-semibold">
          {company?.name ??
            t("İlk şirketinizi oluşturun", "Create your first company")}
        </h1>
        <p className="mt-2 text-sm text-muted">
          {t(
            "Stoklar, depolar ve satın alma işlemleri seçili şirkete aittir.",
            "Stock, warehouses and purchasing belong to the selected company.",
          )}
        </p>
      </div>
      <Invitations />
      <div className="grid gap-5 md:grid-cols-2">
        <section className="panel space-y-3 p-6">
          <ShieldCheck className="text-brand" />
          <h2 className="font-semibold">
            {t("Hesabınız ve erişiminiz", "Your account & access")}
          </h2>
          <p className="text-sm">
            {company
              ? label(company.role)
              : t(
                  "Henüz bir şirkete üye değilsiniz.",
                  "You do not have a company yet.",
                )}
          </p>
          <p className="text-xs text-muted">
            {t(
              "Şirket sahibi e-postanıza davet gönderebilir. Hesap kimliğiniz:",
              "The company owner can invite your email. Your account ID:",
            )}
          </p>
          <code className="block select-all break-all rounded-lg bg-subtle p-3 text-xs">
            {session?.subjectId}
          </code>
        </section>
        <section className="panel space-y-3 p-6">
          <Building2 className="text-brand" />
          <h2 className="font-semibold">{t("Yeni şirket", "New company")}</h2>
          <p className="text-sm text-muted">
            {t(
              "Yeni şirketin sahibi olursunuz. Diğer şirket üyelikleriniz devam eder.",
              "You become the owner. Your other company memberships remain available.",
            )}
          </p>
          <form onSubmit={create} className="space-y-3">
            <label className="block space-y-2 text-sm">
              {t("Şirket adı", "Company name")}
              <Input
                required
                minLength={2}
                maxLength={200}
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={busy}
              />
            </label>
            <Button disabled={busy || name.trim().length < 2}>
              {t("Şirket oluştur", "Create company")}
            </Button>
          </form>
          {error && (
            <p role="alert" className="text-danger">
              {error}
            </p>
          )}
        </section>
      </div>
      <section className="panel p-6">
        <h2 className="mb-4 font-semibold">
          {t("Yetkiler nasıl çalışır?", "How permissions work")}
        </h2>
        <div className="grid gap-4 text-sm sm:grid-cols-2 xl:grid-cols-4">
          {[
            [
              "Owner",
              t(
                "Ekip üyelerini ve tüm envanter işlemlerini yönetir.",
                "Manages team membership and all inventory operations.",
              ),
            ],
            [
              "Manager",
              t(
                "Ürün, depo, tedarikçi ve satın alma işlemlerini yönetir.",
                "Manages products, warehouses, suppliers and purchasing.",
              ),
            ],
            [
              "Operator",
              t(
                "Verileri görüntüler ve depolar arası transfer yapar.",
                "Views data and transfers stock between warehouses.",
              ),
            ],
            [
              "Viewer",
              t(
                "Şirket verilerini yalnızca görüntüler.",
                "Has read-only access to company data.",
              ),
            ],
          ].map(([r, description]) => (
            <div key={r}>
              <p className="font-semibold">{label(r)}</p>
              <p className="mt-1 text-muted">{description}</p>
            </div>
          ))}
        </div>
      </section>
      {company?.role === "Owner" && (
        <MembersPanel key={company.id} companyId={company.id} />
      )}
    </div>
  );
}
