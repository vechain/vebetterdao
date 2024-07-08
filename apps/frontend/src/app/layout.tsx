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
import { getConfig } from "@repo/config"
import "@/i18n"
import { useEffect } from "react"
import { t } from "i18next"

dayjs.extend(relativeTime)
dayjs.extend(duration)

const mixpanelToken = getConfig().mixPanelProjectToken
const isProduction = process.env.NODE_ENV === "production"
const Navbar = dynamic(() => import("@/components/Navbar").then(mod => mod.Navbar), { ssr: false })
const FreshDeskWidget = dynamic(() => import("@/components/FreshDeskWidget").then(mod => mod.FreshDeskWidget), {
  ssr: false,
})

//TODO: Is there a better place to initialise mixpanel? next/script?
typeof window != "undefined" && mixpanelToken && AnalyticsUtils.initialise()

// workaround for "@iconscout/react-unicons
const error = console.error
console.error = (...args: any) => {
  if (/defaultProps/.test(args[0])) return
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
      lang="en"
      style={{
        scrollBehavior: "smooth",
      }}>
      <head>
        <title>{t("VeBetterDAO")}</title>
        <meta name="description" content="Vote for your favourite sustainability Apps in VeBetterDAO’s governance." />
        <link rel="icon" href="/images/favicon.png" />
        <link rel="apple-touch-icon" sizes="57x57" href="/images/favicon.png" />
        <meta name="msapplication-TileImage" content="/images/favicon.png" />

        {/* Open Graph Metadata */}
        <meta name="title" property="og:title" content="VeBetterDAO" />
        <meta name="type" property="og:type" content="website" />
        <meta name="url" property="og:url" content="%VITE_BASE_URL%" />
        <meta
          name="description"
          property="og:description"
          content="Vote for your favourite sustainability Apps in VeBetterDAO’s governance."
        />
        <meta property="og:site_name" content="VeBetterDAO" />
        <meta name="image" property="og:image" content={`${getConfig().basePath}/images/social_image.png`} />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="VeBetterDAO" />

        {/* Twitter Metadata */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="%VITE_BASE_URL%" />
        <meta name="twitter:title" content="VeBetterDAO" />
        <meta
          name="twitter:description"
          content="Vote for your favourite sustainability Apps in VeBetterDAO’s governance."
        />
        <meta name="twitter:image" content={`${getConfig().basePath}/images/social_image.png`} />
        <meta name="twitter:image:alt" content="VeBetterDAO" />
      </head>
      <body>
        <Providers>
          {isProduction && <FreshDeskWidget widgetId={103000007852} />}
          <VStack minH="100vh" gap={0} align="stretch">
            {/* <AlphaTestnetBanner /> */}
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
      </body>
    </html>
  )
}
