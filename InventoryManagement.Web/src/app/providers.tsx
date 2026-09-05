"use client";
import { useState, type ReactNode } from "react";
import { Provider as ReduxProvider } from "react-redux";
import { QueryClientProvider } from "@tanstack/react-query";
import { createQueryClient } from "@/lib/query-client";
import { makeStore } from "@/store";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);
  const [store] = useState(makeStore);
  return (
    <ReduxProvider store={store}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ReduxProvider>
  );
}
