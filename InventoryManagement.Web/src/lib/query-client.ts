import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/api-error";

export function createQueryClient() {
  return new QueryClient({ defaultOptions: {
    queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: (count, error) => !(error instanceof ApiError && error.status === 404) && count < 2 },
    mutations: { retry: false },
  } });
}
