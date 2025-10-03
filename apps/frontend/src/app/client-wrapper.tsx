"use client"

import { Container, Flex, VStack } from "@chakra-ui/react"
import { Providers } from "./providers"
import { Footer, TransactionModal } from "@/components"
import dynamic from "next/dynamic"
import { AnalyticsUtils } from "@/utils"
import { getEnvDatadogApp, getEnvDatadogClient, getEnvDatadogEnv, getEnvMixPanel } from "@repo/config"
import { useEffect } from "react"
import { datadogRum } from "@datadog/browser-rum"
import "@/i18n"
import { Toaster } from "@/components/ui/toaster"

const mixpanelToken = getEnvMixPanel()
const isProduction = process.env.NODE_ENV === "production"
const Navbar = dynamic(() => import("@/components/Navbar").then(mod => mod.Navbar), { ssr: false })
const FreshDeskWidget = dynamic(() => import("@/components/FreshDeskWidget").then(mod => mod.FreshDeskWidget), {
  ssr: false,
})

// Initialise Datadog RUM - get the app token and client token from environment variables
const datadog_app_token = getEnvDatadogApp()
const datadog_client_token = getEnvDatadogClient()
const datadog_env = getEnvDatadogEnv()

if (typeof window !== "undefined" && isProduction) {
  datadogRum.init({
    applicationId: datadog_app_token,
    clientToken: datadog_client_token,
    site: "datadoghq.eu",
    service: "b3tr",
    env: datadog_env,
    sessionSampleRate: 100,
    sessionReplaySampleRate: 20,
    trackUserInteractions: true,
    trackResources: true,
    trackLongTasks: true,
    defaultPrivacyLevel: "mask-user-input",
  })
}

// workaround for "@iconscout/react-unicons and data-new-gr-c-s-check-loaded
const error = console.error
console.error = (...args: any) => {
  if (/defaultProps/.test(args[0])) return
  if (args?.[1]?.includes?.("data-new-gr-c-s-check-loaded,data-gr-ext-installed")) return
  error(...args)
}

//TODO: Is there a better place to initialise mixpanel? next/script?
if (typeof window !== "undefined" && mixpanelToken) {
  AnalyticsUtils.initialise()
}

export function ClientWrapper({ children }: { children: React.ReactNode }) {
  // set color mode of @uiw/react-md-editor
  useEffect(() => {
    document.documentElement.setAttribute("data-color-mode", "light")
    return () => {
      document.documentElement.removeAttribute("data-color-mode")
    }
  }, [])

  return (
    <Providers>
      {isProduction && <FreshDeskWidget widgetId={103000007852} />}
      <VStack minH="100vh" gap={0} align="stretch" bg="layout-bg">
        <Navbar />
        <Flex flex={1}>
          <Container
            flex={1}
            my={{ base: 4, md: 10 }}
            px={4}
            maxW="breakpoint-xl"
            display={"flex"}
            alignItems={"center"}
            justifyContent={"flex-start"}
            flexDirection={"column"}>
            {children}
          </Container>
          <TransactionModal />
          <Toaster />
        </Flex>
        <Footer />
      </VStack>
    </Providers>
  )
}
