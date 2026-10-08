import Link from "next/link";
import type { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <div className="space-y-6"><nav aria-label="Admin" className="flex flex-wrap gap-4 border-b border-line pb-4 text-sm">
    <Link href="/admin">Şirketler / Companies</Link>
    <Link href="/admin/monitoring">Sistem / System</Link>
    <Link href="/admin/monitoring/guide">İzleme rehberi / Monitoring guide</Link>
  </nav>{children}</div>;
}
