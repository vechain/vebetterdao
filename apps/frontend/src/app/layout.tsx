"use client"
// app/layout.tsx
import { Container, Flex, VStack } from "@chakra-ui/react"
import { Providers } from "./providers"

import { Inter } from "next/font/google"
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
})

// const instrumentSans = Instrument_Sans({
//   variable: "--font-instrument-sans",
//   subsets: ["latin"],
//   display: "swap",
// })

import { Footer, TransactionModal } from "@/components"
import dynamic from "next/dynamic"
import { AnalyticsUtils } from "@/utils"
import { getConfig, getEnvDatadogApp, getEnvDatadogClient, getEnvDatadogEnv, getEnvMixPanel } from "@repo/config"
import "@/i18n"
import { useEffect } from "react"
import { t } from "i18next"
import { datadogRum } from "@datadog/browser-rum"

const mixpanelToken = getEnvMixPanel()
const isProduction = process.env.NODE_ENV === "production"
const Navbar = dynamic(() => import("@/components/Navbar").then(mod => mod.Navbar), { ssr: false })
const FreshDeskWidget = dynamic(() => import("@/components/FreshDeskWidget").then(mod => mod.FreshDeskWidget), {
  ssr: false,
})

//TODO: Is there a better place to initialise mixpanel? next/script?
typeof window != "undefined" && mixpanelToken && AnalyticsUtils.initialise()

// Initialise Datadog RUM - get the app token and client token from environment variables
const datadog_app_token = getEnvDatadogApp()
const datadog_client_token = getEnvDatadogClient()
const datadog_env = getEnvDatadogEnv()

if (isProduction) {
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

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // set color mode of @uiw/react-md-editor
  useEffect(() => {
    document.documentElement.setAttribute("data-color-mode", "light")
    return () => {
      document.documentElement.removeAttribute("data-color-mode")
    }
  }, [])

  return (
    <html
      suppressHydrationWarning
      lang="en"
      style={{
        scrollBehavior: "smooth",
      }}
      className={`${inter.variable}`}>
      <head>
        <title>{t("VeBetterDAO")}</title>
        <meta name="description" content="Vote for your favourite sustainability Apps in VeBetterDAO's governance." />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        {/* Favicons */}
        <meta name="apple-mobile-web-app-title" content="VeBetterDAO" />

        {/* Open Graph Metadata */}
        <meta name="title" property="og:title" content="VeBetterDAO" />
        <meta name="type" property="og:type" content="website" />
        <meta name="url" property="og:url" content="%VITE_BASE_URL%" />
        <meta
          name="description"
          property="og:description"
          content="Vote for your favourite sustainability Apps in VeBetterDAO's governance."
        />
        <meta property="og:site_name" content="VeBetterDAO" />
        <meta name="image" property="og:image" content={`${getConfig().basePath}/assets/images/social_image.webp`} />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="VeBetterDAO" />

        {/* Twitter Metadata */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="VeBetterDAO" />
        <meta
          name="twitter:description"
          content="Vote for your favourite sustainability Apps in VeBetterDAO's governance."
        />
        <meta name="twitter:image" content={`${getConfig().basePath}/assets/images/social_image.webp`} />
        <meta name="twitter:image:alt" content="VeBetterDAO" />
      </head>
      <body>
        <Providers>
          {isProduction && <FreshDeskWidget widgetId={103000007852} />}
          <VStack minH="100vh" gap={0} align="stretch" bg="layout-bg">
            <Navbar />
            <Flex flex={1}>
              <Container
                mt={{ base: 2, md: 10 }}
                mb={[20, 20, 20]}
                px={[4, 4, 4]}
                maxW="breakpoint-xl"
                display={"flex"}
                flex={1}
                alignItems={"center"}
                justifyContent={"flex-start"}
                flexDirection={"column"}>
                {children}
              </Container>
              <TransactionModal />
            </Flex>
            <Footer />
          </VStack>
        </Providers>
      </body>
    </html>
  )
}
