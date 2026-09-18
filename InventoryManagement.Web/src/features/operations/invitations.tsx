"use client";
import { useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { useAuth } from "@/features/auth/components/auth-provider";
import {
  useCompany,
  useCompanyText,
} from "@/features/companies/company-provider";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
type Invite = {
  id: string;
  companyId: string;
  companyName: string;
  email: string;
  role: string;
  expiresAtUtc: string;
  acceptedAtUtc?: string;
  revokedAtUtc?: string;
  emailSentAtUtc?: string;
  emailAttempts: number;
};
export function Invitations() {
  const t = useCompanyText(),
    cache = useQueryClient(),
    auth = useAuth();
  const label = (r: string) =>
    (
      ({
        Manager: t("Yönetici", "Manager"),
        Operator: t("Operatör", "Operator"),
        Viewer: t("İzleyici", "Viewer"),
      }) as Record<string, string>
    )[r] ?? r;
  const { company } = useCompany();
  const manage = company?.role === "Owner" || auth.admin;
  const [email, setEmail] = useState(""),
    [role, setRole] = useState("Viewer"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const mine = useQuery({
    queryKey: ["my-invitations", auth.client?.subject],
    queryFn: () => apiClient<Invite[]>("/api/company-invitations"),
  });
  const sent = useQuery({
    queryKey: ["sent-invitations", company?.id],
    enabled: manage && !!company,
    queryFn: () =>
      apiClient<Invite[]>("/api/company-invitations?companyId=" + company!.id),
    refetchInterval: 30000,
  });
  async function action(run: () => Promise<unknown>, accepted = false) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await run();
      setEmail("");
      setNotice(t("İşlem kaydedildi.", "Changes saved."));
      await cache.invalidateQueries();
      if (accepted) window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  }
  function invite(e: FormEvent) {
    e.preventDefault();
    void action(() =>
      apiClient("/api/company-invitations", {
        method: "POST",
        body: { companyId: company!.id, email, role },
      }),
    );
  }
  return (
    <section className="panel space-y-5 p-6">
      <h2 className="font-semibold">
        {t("E-posta davetleri", "Email invitations")}
      </h2>
      <p className="text-sm text-muted">
        {t(
          "Davetler 7 gün geçerlidir. Kabul etmek için davet edilen doğrulanmış e-posta hesabıyla giriş yapın.",
          "Invitations expire after 7 days. Sign in with the invited, verified email address to accept.",
        )}
      </p>
      {mine.error && <p role="alert">{mine.error.message}</p>}
      {mine.isPending ? (
        <p role="status">{t("Davetler yükleniyor…", "Loading invitations…")}</p>
      ) : !mine.data?.length ? (
        <p className="text-sm text-muted">
          {t("Bekleyen davetiniz yok.", "You have no pending invitations.")}
        </p>
      ) : (
        <ul className="space-y-2">
          {mine.data.map((i) => (
            <li
              className="flex items-center justify-between gap-3 rounded border border-line p-3"
              key={i.id}
            >
              <span>
                {i.companyName} · {label(i.role)}
              </span>
              <Button
                disabled={busy}
                onClick={() =>
                  void action(
                    () =>
                      apiClient(`/api/company-invitations/${i.id}/accept`, {
                        method: "POST",
                      }),
                    true,
                  )
                }
              >
                {t("Kabul et", "Accept")}
              </Button>
            </li>
          ))}
        </ul>
      )}
      {manage && company && (
        <>
          <form onSubmit={invite} className="flex flex-wrap items-end gap-3">
            <label className="grow text-sm">
              {t("Davet edilecek e-posta", "Email to invite")}
              <Input
                type="email"
                required
                maxLength={320}
                disabled={busy}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label className="text-sm">
              {t("Rol", "Role")}
              <select
                className="field"
                disabled={busy}
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                {["Manager", "Operator", "Viewer"].map((r) => (
                  <option key={r} value={r}>
                    {label(r)}
                  </option>
                ))}
              </select>
            </label>
            <Button disabled={busy}>
              {t("Davet gönder", "Send invitation")}
            </Button>
          </form>
          {sent.error && <p role="alert">{sent.error.message}</p>}
          <p className="text-xs text-muted">
            {t(
              "Son 200 davet gösterilir. Süresi dolan veya iletilemeyen daveti aynı e-postaya yeniden gönderebilirsiniz.",
              "Showing the latest 200 invitations. Reinvite the same email if delivery fails or the invitation expires.",
            )}
          </p>
          <ul className="space-y-2 text-sm">
            {sent.data?.map((i) => {
              const expired =
                new Date(i.expiresAtUtc).getTime() <= sent.dataUpdatedAt;
              return (
                <li
                  key={i.id}
                  className="flex flex-wrap items-center justify-between gap-3 border-t border-line py-3"
                >
                  <div>
                    <p>
                      {i.email} · {label(i.role)}
                    </p>
                    <p className="text-xs text-muted">
                      {i.acceptedAtUtc
                        ? t("Kabul edildi", "Accepted")
                        : i.revokedAtUtc
                          ? t("İptal edildi", "Revoked")
                          : expired
                            ? t("Süresi doldu", "Expired")
                            : i.emailSentAtUtc
                              ? t("E-posta gönderildi", "Email sent")
                              : i.emailAttempts >= 8
                                ? t(
                                    "E-posta iletilemedi; yeniden davet edin",
                                    "Email failed; send a new invitation",
                                  )
                                : t("E-posta kuyruğunda", "Email queued")}{" "}
                      · {t("Son tarih", "Expires")}:{" "}
                      {new Date(i.expiresAtUtc).toLocaleDateString()}
                    </p>
                  </div>
                  {!i.acceptedAtUtc && !i.revokedAtUtc && !expired && (
                    <Button
                      variant="secondary"
                      disabled={busy}
                      onClick={() =>
                        void action(() =>
                          apiClient(`/api/company-invitations/${i.id}`, {
                            method: "DELETE",
                          }),
                        )
                      }
                    >
                      {t("Daveti iptal et", "Revoke")}
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
      {error && (
        <p role="alert" className="text-danger">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="text-success">
          {notice}
        </p>
      )}
    </section>
  );
}
