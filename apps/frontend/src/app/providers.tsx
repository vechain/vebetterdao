"use client"
// app/providers.tsx

import { persister, queryClient } from "@/api"
import { CacheProvider } from "@chakra-ui/next-js"
import { ChakraProvider } from "@chakra-ui/react"
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client"

import { ReactQueryDevtools } from "@tanstack/react-query-devtools"

import { DappKitWithChakraProvider } from "@/providers/DappKitWithChakraProvider"
import { lightTheme } from "./theme"

export function Providers({ children }: { children: React.ReactNode }) {
  //TODO: Reenable this to enable dark mode
  //   const { selectedTheme } = useSelectedTheme()
  return (
    <CacheProvider>
      <PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
        <ReactQueryDevtools initialIsOpen={false} />
        <ChakraProvider theme={lightTheme}>
          <DappKitWithChakraProvider>{children}</DappKitWithChakraProvider>
        </ChakraProvider>
      </PersistQueryClientProvider>
    </CacheProvider>
  )
}
