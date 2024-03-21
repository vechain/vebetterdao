import React from "react"

import { ChakraProvider } from "@chakra-ui/react"
import { CacheProvider } from "@chakra-ui/next-js"
import { QueryClient } from "@tanstack/react-query"
import { persister } from "@/api"
import { lightTheme } from "@/app/theme"
import { DappKitWithChakraProvider } from "@/providers/DappKitWithChakraProvider"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
})

export const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
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
