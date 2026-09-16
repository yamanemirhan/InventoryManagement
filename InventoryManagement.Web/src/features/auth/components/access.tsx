"use client";
import type { ReactNode } from "react";
import { useCompany } from "@/features/companies/company-provider";
export function AdminOnly({ children }: { children: ReactNode }) {
  const { company } = useCompany();
  return company && ["Owner", "Manager"].includes(company.role)
    ? children
    : null;
}
export function ActionAccess({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  const { company } = useCompany();
  const roles =
    href === "/stocks/transfer"
      ? ["Owner", "Manager", "Operator"]
      : ["Owner", "Manager"];
  return company && roles.includes(company.role) ? children : null;
}
