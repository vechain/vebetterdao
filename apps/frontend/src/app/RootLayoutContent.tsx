"use client"

// app/layout.tsx
import { Container, Flex, VStack } from "@chakra-ui/react"
import { Providers } from "./providers"

import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import duration from "dayjs/plugin/duration"
import { Footer } from "@/components"
import dynamic from "next/dynamic"
import { AnalyticsUtils } from "@/utils"
import { getConfig, getEnvDatadogApp, getEnvDatadogClient, getEnvDatadogEnv } from "@repo/config"
import { useEffect } from "react"
import { datadogRum } from "@datadog/browser-rum"
import "@/i18n"

dayjs.extend(relativeTime)
dayjs.extend(duration)

const mixpanelToken = getConfig().mixPanelProjectToken
const isProduction = process.env.NODE_ENV === "production"
const Navbar = dynamic(() => import("@/components/Navbar").then(mod => mod.Navbar), { ssr: false })
const FreshDeskWidget = dynamic(() => import("@/components/FreshDeskWidget").then(mod => mod.FreshDeskWidget), {
  ssr: false,
})

// Initialize analytics tools
if (typeof window !== "undefined" && mixpanelToken) {
  AnalyticsUtils.initialise()
}

// Initialise Datadog RUM
const datadog_app_token = getEnvDatadogApp()
const datadog_client_token = getEnvDatadogClient()
const datadog_env = getEnvDatadogEnv()

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

// Workaround for error logging
const error = console.error
console.error = (...args: any) => {
  if (/defaultProps/.test(args[0])) return
  error(...args)
}

export const RootLayoutContent = ({ children }: Readonly<{ children: React.ReactNode }>) => {
  // Set color mode of @uiw/react-md-editor
  useEffect(() => {
    document.documentElement.setAttribute("data-color-mode", "light")
    return () => {
      document.documentElement.removeAttribute("data-color-mode")
    }
  }, [])

  return (
    <Providers>
      {isProduction && <FreshDeskWidget widgetId={103000007852} />}
      <VStack minH="100vh" gap={0} align="stretch">
        <Navbar />
        <Flex flex={1}>
          <Container
            mt={{ base: 2, md: 10 }}
            mb={[20, 20, 40]}
            maxW={"container.xl"}
            display={"flex"}
            flex={1}
            alignItems={"center"}
            justifyContent={"flex-start"}
            flexDirection={"column"}>
            {children}
          </Container>
        </Flex>
        <Footer />
      </VStack>
    </Providers>
  )
}
