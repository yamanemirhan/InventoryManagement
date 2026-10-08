"use client";
import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./auth-provider";
import { LoginPanel } from "./login-panel";
import { useI18n } from "@/lib/i18n/provider";
import { safeReturnPath } from "../lib/keycloak";
import { LinkButton } from "@/components/ui/link-button";
import {
  useCompany,
  useCompanyText,
} from "@/features/companies/company-provider";
import { CompanyPage } from "@/features/companies/company-page";
import { Button } from "@/components/ui/button";

export function AuthGate({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const workspace = useCompany();
  const t = useCompanyText();
  const path = usePathname();
  const router = useRouter();
  const { m } = useI18n();
  useEffect(() => {
    if (auth.status === "authenticated" && path.startsWith("/auth")) {
      const target = safeReturnPath(sessionStorage.getItem("inventory-return"));
      sessionStorage.removeItem("inventory-return");
      router.replace(target);
    }
  }, [auth.status, path, router]);
  if (auth.status !== "authenticated") return <LoginPanel />;
  if (path === "/account") return children;
  if (workspace.loading) return <p role="status">{m.auth.checking}</p>;
  if (workspace.error)
    return (
      <div className="panel space-y-4 p-6">
        <p role="alert">{workspace.error.message}</p>
        <Button onClick={workspace.retry}>{t("Tekrar dene", "Retry")}</Button>
      </div>
    );
  if (path.startsWith("/admin") && !auth.admin)
    return <p role="alert">{m.auth.forbidden}</p>;
  if (path === "/companies" || path.startsWith("/admin")) return children;
  if (!workspace.company) return <CompanyPage />;
  const canRead = !!workspace.company;
  const canManage = ["Owner", "Manager"].includes(workspace.company.role);
  const canTransfer = ["Owner", "Manager", "Operator"].includes(
    workspace.company.role,
  );
  const adminPage =
    /\/(products|warehouses|suppliers|purchase-orders)\/new$/.test(path) ||
    path === "/stocks/increase" ||
    path === "/knowledge/new" ||
    path === "/activity" ||
    path === "/imports";
  if (
    !canRead ||
    (adminPage && !canManage) ||
    (path === "/stocks/transfer" && !canTransfer)
  )
    return (
      <div className="panel mx-auto max-w-xl space-y-5 p-8">
        <h1 className="text-xl font-semibold">{m.auth.forbidden}</h1>
        <p className="text-sm text-muted">
          {canRead ? m.auth.forbiddenDescription : m.auth.noRole}
        </p>
        {canRead && <LinkButton href="/">{m.auth.back}</LinkButton>}
        <Button variant="secondary" onClick={() => auth.logout()}>
          {m.auth.logout}
        </Button>
      </div>
    );
  if (path.startsWith("/auth")) return <p role="status">{m.auth.checking}</p>;
  return children;
}
