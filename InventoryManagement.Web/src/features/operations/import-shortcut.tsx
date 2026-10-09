"use client";
import Link from "next/link";
import { useCompany, useCompanyText } from "@/features/companies/company-provider";
export function ImportShortcut() {
  const { company } = useCompany(), t = useCompanyText();
  if (!company || !["Owner", "Manager"].includes(company.role)) return null;
  return <Link className="mb-5 inline-block text-sm text-brand" href="/imports">{t("Excel / CSV ile toplu ekle →", "Bulk add with Excel / CSV →")}</Link>;
}
