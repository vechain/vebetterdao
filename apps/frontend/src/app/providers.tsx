"use client"
// app/providers.tsx

import { persister, queryClient } from "@/api"
import { Provider } from "@/components/ui/provider"
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client"

import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import dynamic from "next/dynamic"

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
    <>
      <PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
        <ReactQueryDevtools initialIsOpen={false} />
        <Provider>
          <VechainKitProviderWrapper>
            <AuthSessionProvider>
              <TransactionModalProvider>{children}</TransactionModalProvider>
            </AuthSessionProvider>
          </VechainKitProviderWrapper>
        </Provider>
      </PersistQueryClientProvider>
      <Analytics />
    </>
  )
}
