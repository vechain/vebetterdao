"use client"
// app/providers.tsx

import { persister, queryClient } from "@/api"
import { CacheProvider } from "@chakra-ui/next-js"
import { ChakraProvider, useColorMode, useColorModePreference, useColorModeValue } from "@chakra-ui/react"
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client"

import { ReactQueryDevtools } from "@tanstack/react-query-devtools"

import { DappKitWithChakraProvider } from "@/providers/DappKitWithChakraProvider"
import { useSelectedTheme } from "@/store"

export function Providers({ children }: { children: React.ReactNode }) {
  const { selectedTheme } = useSelectedTheme()
  return (
    <CacheProvider>
      <PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
        <ReactQueryDevtools initialIsOpen={false} />
        <ChakraProvider theme={selectedTheme}>
          <DappKitWithChakraProvider>{children}</DappKitWithChakraProvider>
        </ChakraProvider>
      </PersistQueryClientProvider>
    </CacheProvider>
  )
}
