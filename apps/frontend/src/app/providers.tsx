"use client"
// app/providers.tsx

import { persister, queryClient } from "@/api"
import { CacheProvider } from "@chakra-ui/next-js"
import { ChakraProvider } from "@chakra-ui/react"
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client"

import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import dynamic from "next/dynamic"

import { DappKitWithChakraProvider } from "@/providers/DappKitWithChakraProvider"
import { lightTheme } from "./theme"
import { AuthSessionProvider } from "@/providers/AuthSessionProvider"

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
          <DappKitWithChakraProvider>
            <VechainKitProviderWrapper>
              <AuthSessionProvider>{children}</AuthSessionProvider>
            </VechainKitProviderWrapper>
          </DappKitWithChakraProvider>
        </ChakraProvider>
      </PersistQueryClientProvider>
    </CacheProvider>
  )
}
