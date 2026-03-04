"use client"

import { QueryClientProvider } from "@tanstack/react-query"
import dynamic from "next/dynamic"

import { queryClient } from "@/api/QueryProvider"
import { Provider } from "@/components/ui/provider"

import "./theme/vechain-kit-fixes.css"

const VechainKitProviderWrapper = dynamic(
  () => import("@/providers/VechainKitProviderWrapper").then(mod => mod.VechainKitProviderWrapper),
  { ssr: false },
)

export function Providers({ children }: { readonly children: React.ReactNode }) {
  return (
    <Provider>
      <QueryClientProvider client={queryClient}>
        <VechainKitProviderWrapper>{children}</VechainKitProviderWrapper>
      </QueryClientProvider>
    </Provider>
  )
}
