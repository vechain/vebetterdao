import React from "react"

import { ChakraProvider } from "@chakra-ui/react"
import { CacheProvider } from "@chakra-ui/next-js"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { lightTheme } from "@/app/theme"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import dynamic from "next/dynamic"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
})
const VechainKitProviderWrapper = dynamic(
  async () => (await import("../src/providers/VechainKitProviderWrapper")).VechainKitProviderWrapper,
  {
    ssr: false,
  },
)

export const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <CacheProvider>
      <QueryClientProvider client={queryClient}>
        <ReactQueryDevtools initialIsOpen={false} />
        <ChakraProvider theme={lightTheme}>
          <VechainKitProviderWrapper>{children}</VechainKitProviderWrapper>
        </ChakraProvider>
      </QueryClientProvider>
    </CacheProvider>
  )
}
