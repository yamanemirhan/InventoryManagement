"use client";
import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./auth-provider";
import { LoginPanel } from "./login-panel";
import { useI18n } from "@/lib/i18n/provider";
import { safeReturnPath } from "../lib/keycloak";
import { LinkButton } from "@/components/ui/link-button";
import { Button } from "@/components/ui/button";

export function AuthGate({ children }: { children: ReactNode }) {
  const auth = useAuth();
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
  const canRead = auth.admin || auth.user;
  const adminPage =
    /\/(products|warehouses|suppliers|purchase-orders)\/new$/.test(path) ||
    path === "/stocks/increase";
  if (!canRead || (adminPage && !auth.admin))
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
