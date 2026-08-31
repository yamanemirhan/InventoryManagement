import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { Providers } from "./providers";
import "./globals.css";
export const metadata: Metadata = { title: { default: "Inventory OS", template: "%s | Inventory OS" }, description: "Product, warehouse and stock operations management." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body><Providers><AppShell>{children}</AppShell></Providers></body></html>; }
