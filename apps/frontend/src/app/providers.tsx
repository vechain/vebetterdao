"use client"
// app/providers.tsx

import { persister, queryClient } from "@/api"
import { CacheProvider } from "@chakra-ui/next-js"
import { ChakraProvider, ColorModeScript } from "@chakra-ui/react"
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client"

import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import dynamic from "next/dynamic"

import { lightTheme } from "./theme"
import { AuthSessionProvider } from "@/providers/AuthSessionProvider"
import { Analytics } from "@vercel/analytics/react"
import { TransactionModalProvider } from "@/providers/TransactionModalProvider"
const VechainKitProviderWrapper = dynamic(
  async () => (await import("../providers/VechainKitProviderWrapper")).VechainKitProviderWrapper,
  {
    ssr: false,
  },
)

export function Providers({ children }: { readonly children: React.ReactNode }) {
  return (
    <CacheProvider>
      <PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
        <ReactQueryDevtools initialIsOpen={false} />
        <ChakraProvider theme={lightTheme}>
          <ColorModeScript initialColorMode="system" />
          <VechainKitProviderWrapper>
            <AuthSessionProvider>
              <TransactionModalProvider>{children}</TransactionModalProvider>
            </AuthSessionProvider>
          </VechainKitProviderWrapper>
        </ChakraProvider>
      </PersistQueryClientProvider>
      <Analytics />
    </CacheProvider>
  )
}
