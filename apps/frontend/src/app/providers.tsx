"use client"
// app/providers.tsx
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client"
import { IconoirProvider } from "iconoir-react"
import dynamic from "next/dynamic"

import { Provider } from "@/components/ui/provider"
import { AuthSessionProvider } from "@/providers/AuthSessionProvider"
import { TransactionModalProvider } from "@/providers/TransactionModalProvider"

import { queryClient, persister } from "../api/QueryProvider"

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
              <IconoirProvider iconProps={{ strokeWidth: "2" }}>
                <TransactionModalProvider>{children}</TransactionModalProvider>
              </IconoirProvider>
            </AuthSessionProvider>
          </VechainKitProviderWrapper>
        </Provider>
      </PersistQueryClientProvider>
    </>
  )
}
