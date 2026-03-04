import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister"
import { QueryClient } from "@tanstack/react-query"
import type { Persister } from "@tanstack/react-query-persist-client"

export const persister: Persister = createSyncStoragePersister({
  storage: typeof window !== "undefined" ? window.localStorage : undefined,
})

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 0,
      retryOnMount: false,
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  },
})
