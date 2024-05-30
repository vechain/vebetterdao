import React from "react"

import { ChakraProvider } from "@chakra-ui/react"
import { CacheProvider } from "@chakra-ui/next-js"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { lightTheme } from "@/app/theme"
import { DappKitWithChakraProvider } from "@/providers/DappKitWithChakraProvider"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"

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
      <QueryClientProvider client={queryClient}>
        <ReactQueryDevtools initialIsOpen={false} />
        <ChakraProvider theme={lightTheme}>
          <DappKitWithChakraProvider>{children}</DappKitWithChakraProvider>
        </ChakraProvider>
      </QueryClientProvider>
    </CacheProvider>
  )
}
