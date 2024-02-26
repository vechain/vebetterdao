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
  return (
    <html lang="en">
      <head>
        <title>VeBetterDao</title>
        <meta name="description" content="Vote for your favourite sustainability dApps in vebetterdao’s governance." />
        <link rel="icon" href="/images/favicon.png" />

        <meta property="og:title" content="VeBetterDao" />
        <meta property="og:type" content="website" />
        <meta
          property="og:description"
          content="Vote for your favourite sustainability dApps in vebetterdao’s governance."
        />
        <meta property="og:site_name" content="VeBetterDao" />
        <meta name="og:image:type" content="image/png" />
        <meta name="og:image:width" content="1200" />
        <meta name="og:image:height" content="630" />
        <meta name="og:image" content={`${getConfig().basePath}/images/social_image.png`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image:type" content="image/png" />
        <meta name="twitter:image:width" content="1200" />
        <meta name="twitter:image:height" content="630" />
        <meta name="twitter:image" content={`${getConfig().basePath}/images/social_image.png`} />
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
