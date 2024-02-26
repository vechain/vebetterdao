"use client"
// app/layout.tsx
import { Container, Flex, VStack } from "@chakra-ui/react"
import { Providers } from "./providers"

import dayjs from "dayjs"

import relativeTime from "dayjs/plugin/relativeTime"
import { Footer } from "@/components"
import dynamic from "next/dynamic"
import { AnalyticsUtils } from "@/utils"
import { getConfig } from "@repo/config"

dayjs.extend(relativeTime)

const mixpanelToken = getConfig().mixPanelProjectToken
const Navbar = dynamic(() => import("@/components/Navbar").then(mod => mod.Navbar), { ssr: false })

//TODO: Is there a better place to initialise mixpanel? next/script?
typeof window != "undefined" && mixpanelToken && AnalyticsUtils.initialise()

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const baseUrl = typeof window != "undefined" ? window.location.origin : "https://governance.vebetterdao.org"
  return (
    <html lang="en">
      <head>
        <title>VeBetterDao governance app</title>
        <meta name="description" content="Vote for your favourite sustainability dApps in vebetterdao’s governance." />
        <link rel="icon" href="/images/favicon.png" />

        <meta property="og:title" content="VeBetterDao governance app" />
        <meta property="og:type" content="article" />
        <meta property="og:image" content={`${baseUrl}/images/governance_banner.png`} />
        <meta property="og:url" content={baseUrl} />
        <meta name="twitter:card" content="summary_large_image" />

        <meta
          property="og:description"
          content="Vote for your favourite sustainability dApps in vebetterdao’s governance."
        />
        <meta property="og:site_name" content="VeBetterDao" />
        <meta name="twitter:image:alt" content="VeBetterDao governance app" />
      </head>
      <body>
        <Providers>
          <VStack h="100vh" gap={0} align="stretch">
            <Navbar />
            <Flex flex={1}>
              <Container
                mt={10}
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
