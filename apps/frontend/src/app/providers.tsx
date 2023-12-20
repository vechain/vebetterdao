// app/providers.tsx
"use client";

import { queryClient } from "@/api";
import { CacheProvider } from "@chakra-ui/next-js";
import { ChakraProvider } from "@chakra-ui/react";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";

import type { WalletConnectOptions } from "@vechain/dapp-kit";
import dynamic from "next/dynamic";

const DAppKitProvider = dynamic(() => import("@vechain/dapp-kit-react").then(mod => mod.DAppKitProvider), {
  ssr: false,
});

const walletConnectOptions: WalletConnectOptions = {
  projectId: "a0b855ceaf109dbc8426479a4c3d38d8",
  metadata: {
    name: "b3tr",
    description: "b3tr",
    url: typeof window !== "undefined" ? window.location.origin : "",
    icons: [typeof window !== "undefined" ? `${window.location.origin}/images/logo/my-dapp.png` : ""],
  },
};

// to persist react-query daya in LS
const persister = createSyncStoragePersister({
  storage: window.localStorage,
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CacheProvider>
      <DAppKitProvider
        genesis="test"
        nodeUrl="https://testnet.vechain.org/"
        usePersistence
        walletConnectOptions={walletConnectOptions}>
        <PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
          <ChakraProvider>{children}</ChakraProvider>
        </PersistQueryClientProvider>
      </DAppKitProvider>
    </CacheProvider>
  );
}
