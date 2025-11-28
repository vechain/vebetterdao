"use client"
import { Container, Flex, VStack } from "@chakra-ui/react"
import { datadogRum } from "@datadog/browser-rum"
import { getEnvDatadogApp, getEnvDatadogClient, getEnvDatadogEnv, getEnvMixPanel } from "@repo/config"
import dynamic from "next/dynamic"
import { useEffect } from "react"

import { Toaster } from "@/components/ui/toaster"

import { Footer } from "../components/Footer/Footer"
import { TransactionModal } from "../components/TransactionModal/TransactionModal"
import AnalyticsUtils from "../utils/AnalyticsUtils/AnalyticsUtils"

import { Providers } from "./providers"

import "@/i18n"
import "./theme/vechain-kit-fixes.css"

const mixpanelToken = getEnvMixPanel()
const isProduction = process.env.NODE_ENV === "production"
const Navbar = dynamic(() => import("@/components/Navbar/Navbar").then(mod => mod.Navbar), { ssr: false })
const FreshDeskWidget = dynamic(
  () => import("@/components/FreshDeskWidget/FreshDeskWidget").then(mod => mod.FreshDeskWidget),
  {
    ssr: false,
  },
)
// Datadog RUM config - will be initialized after page load
const datadog_app_token = getEnvDatadogApp()
const datadog_client_token = getEnvDatadogClient()
const datadog_env = getEnvDatadogEnv()

// workaround for "@iconscout/react-unicons and data-new-gr-c-s-check-loaded
const error = console.error
console.error = (...args: any) => {
  if (/defaultProps/.test(args[0])) return
  if (args?.[1]?.includes?.("data-new-gr-c-s-check-loaded,data-gr-ext-installed")) return
  error(...args)
}

export function ClientWrapper({ children }: { children: React.ReactNode }) {
  // set color mode of @uiw/react-md-editor
  useEffect(() => {
    document.documentElement.setAttribute("data-color-mode", "light")
    return () => {
      document.documentElement.removeAttribute("data-color-mode")
    }
  }, [])

  // Defer analytics initialization until after page load
  useEffect(() => {
    if (typeof window === "undefined") return

    const initAnalytics = () => {
      // Initialize Datadog RUM
      if (isProduction && datadog_app_token && datadog_client_token) {
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

      // Initialize Mixpanel
      if (mixpanelToken) {
        AnalyticsUtils.initialise()
      }
    }

    // Defer initialization after page load
    if (document.readyState === "complete") {
      setTimeout(initAnalytics, 1000)
    } else {
      window.addEventListener("load", () => setTimeout(initAnalytics, 1000))
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
