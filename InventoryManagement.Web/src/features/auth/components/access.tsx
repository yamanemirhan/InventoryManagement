"use client";
import type { ReactNode } from "react";
import { useAuth } from "./auth-provider";
export function AdminOnly({ children }: { children: ReactNode }) {
  return useAuth().admin ? children : null;
}

export function ActionAccess({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  const auth = useAuth();
  return href === "/stocks/transfer" || auth.admin ? children : null;
}
