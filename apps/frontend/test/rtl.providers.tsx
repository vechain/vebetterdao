import React from "react"
import { ChakraProvider } from "@chakra-ui/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import dynamic from "next/dynamic"

import theme from "@/app/theme/theme"

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
    <QueryClientProvider client={queryClient}>
      <ReactQueryDevtools initialIsOpen={false} />
      <ChakraProvider value={theme}>
        <VechainKitProviderWrapper>{children}</VechainKitProviderWrapper>
      </ChakraProvider>
    </QueryClientProvider>
  )
}
