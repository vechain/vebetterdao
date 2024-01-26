"use client"
// app/providers.tsx

import { persister, queryClient } from "@/api"
import { CacheProvider } from "@chakra-ui/next-js"
import { ChakraProvider } from "@chakra-ui/react"
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client"

import { ReactQueryDevtools } from "@tanstack/react-query-devtools"

import { getConfig } from "@repo/config"
import { theme } from "./theme"
import { DappKitWithChakraProvider } from "@/providers/DappKitWithChakraProvider"

const config = getConfig()

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CacheProvider>
      <PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
        <ReactQueryDevtools initialIsOpen={false} />
        <ChakraProvider theme={theme}>
          <DappKitWithChakraProvider>{children}</DappKitWithChakraProvider>
        </ChakraProvider>
      </PersistQueryClientProvider>
    </CacheProvider>
  )
}
