"use client"
// app/providers.tsx

import { persister, queryClient } from "@/api"
import { CacheProvider } from "@chakra-ui/next-js"
import { ChakraProvider } from "@chakra-ui/react"
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client"

import { ReactQueryDevtools } from "@tanstack/react-query-devtools"

import { DappKitWithChakraProvider } from "@/providers/DappKitWithChakraProvider"
import { lightTheme } from "./theme"
import { useLanguage } from "@/store/useLanguage"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"

export function Providers({ children }: { children: React.ReactNode }) {
  //TODO: Reenable this to enable dark mode
  //   const { selectedTheme } = useSelectedTheme()

  const { i18n } = useTranslation()
  const { language } = useLanguage()

  useEffect(() => {
    i18n.changeLanguage(language)
  }, [i18n, language])

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
