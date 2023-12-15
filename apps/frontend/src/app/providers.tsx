// app/providers.tsx
"use client";

import { CacheProvider } from "@chakra-ui/next-js";
import { ChakraProvider } from "@chakra-ui/react";

import type { WalletConnectOptions } from "@vechain/dapp-kit";
import dynamic from "next/dynamic";

const DAppKitProvider = dynamic(
  () => import("@vechain/dapp-kit-react").then((mod) => mod.DAppKitProvider),
  { ssr: false }
);

const walletConnectOptions: WalletConnectOptions = {
  projectId: "a0b855ceaf109dbc8426479a4c3d38d8",
  metadata: {
    name: "b3tr",
    description: "b3tr",
    url: typeof window !== "undefined" ? window.location.origin : "",
    icons: [
      typeof window !== "undefined"
        ? `${window.location.origin}/images/logo/my-dapp.png`
        : "",
    ],
  },
};
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CacheProvider>
      <DAppKitProvider
        genesis="test"
        nodeUrl="https://testnet.vechain.org/"
        usePersistence
        walletConnectOptions={walletConnectOptions}
      >
        <ChakraProvider>{children}</ChakraProvider>
      </DAppKitProvider>
    </CacheProvider>
  );
}
