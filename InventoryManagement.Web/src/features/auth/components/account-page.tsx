"use client";
import { useState } from "react";
import { KeyRound, Mail, ShieldCheck, UserRound } from "lucide-react";
import { useAuth } from "./auth-provider";
import { useCompanyText } from "@/features/companies/company-provider";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

export function AccountPage() {
  const auth = useAuth();
  const t = useCompanyText();
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const claims = auth.client?.tokenParsed;
  const run = async (action: () => Promise<void>) => {
    setPending(true);
    setFailed(false);
    try {
      await action();
    } catch {
      setFailed(true);
    } finally {
      setPending(false);
    }
  };
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("Hesabım", "My account")}</h1>
        <p className="mt-2 text-sm text-muted">
          {t(
            "Kişisel bilgilerinizi ve hesap güvenliğinizi yönetin.",
            "Manage your personal details and account security.",
          )}
        </p>
      </div>
      {failed && (
        <Alert
          tone="error"
          title={t(
            "İşlem başlatılamadı. Lütfen yeniden deneyin.",
            "Could not start the action. Please try again.",
          )}
        />
      )}
      <section className="panel space-y-5 p-6 sm:p-8" aria-labelledby="account-profile">
        <h2 id="account-profile" className="flex items-center gap-2 text-lg font-semibold">
          <UserRound className="size-5 text-brand" />
          {t("Profil", "Profile")}
        </h2>
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted">{t("Ad soyad", "Full name")}</dt>
            <dd className="mt-1 font-medium">{auth.name || "—"}</dd>
          </div>
          <div>
            <dt className="flex items-center gap-1 text-muted">
              <Mail className="size-4" />{t("E-posta", "Email")}
            </dt>
            <dd className="mt-1 break-all font-medium">{String(claims?.email ?? "—")}</dd>
          </div>
        </dl>
        <p className="flex items-center gap-2 text-xs text-muted">
          <ShieldCheck className="size-4" />
          {claims?.email_verified
            ? t("E-posta adresiniz doğrulandı.", "Your email address is verified.")
            : t("E-posta doğrulaması gerekiyor.", "Email verification is required.")}
        </p>
        <Button variant="secondary" disabled={pending} onClick={() => run(auth.updateProfile)}>
          {t("Profilimi düzenle", "Edit my profile")}
        </Button>
      </section>
      <section className="panel space-y-4 p-6 sm:p-8" aria-labelledby="account-security">
        <h2 id="account-security" className="flex items-center gap-2 text-lg font-semibold">
          <KeyRound className="size-5 text-brand" />{t("Güvenlik", "Security")}
        </h2>
        <p className="text-sm leading-6 text-muted">
          {t(
            "Şifreniz 12–128 karakter, en az bir büyük harf, bir küçük harf ve bir rakam içermeli. E-posta adresinizle aynı olmamalı.",
            "Use 12–128 characters with an uppercase letter, a lowercase letter and a number. Your password must differ from your email.",
          )}
        </p>
        <Button disabled={pending} onClick={() => run(auth.changePassword)}>
          {t("Şifremi değiştir", "Change my password")}
        </Button>
        <p className="text-xs leading-5 text-muted">
          {t(
            "Google ile giriş yapıyorsanız Google şifrenizi değiştirmez; hesabınıza ayrı bir şifre tanımlar.",
            "For Google sign-in, this sets a separate account password and does not change your Google password.",
          )}
        </p>
      </section>
    </div>
  );
}
