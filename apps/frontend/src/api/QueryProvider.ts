
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { QueryClient } from "@tanstack/react-query";

// to persist react-query daya in LS
export const persister = createSyncStoragePersister({
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
});

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 0,
            staleTime: 30000,
            refetchOnWindowFocus: true,
            refetchOnMount: true,
            refetchOnReconnect: true,
            refetchInterval: false,
            refetchIntervalInBackground: false,
        },
    },
})