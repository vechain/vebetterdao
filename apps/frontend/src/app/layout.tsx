"use client"
// app/layout.tsx
import { Container } from "@chakra-ui/react"
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
        <title>VeBetterDao governance app</title>
        <meta name="description" content="Vote for your favourite sustainability dApps in vebetterdao’s governance." />
        <link rel="icon" href="/images/favicon.png" />

        <meta property="og:title" content="VeBetterDao governance app" />
        <meta property="og:type" content="article" />
        <meta property="og:image" content="https://governance.vebetterdao.org/images/governance_banner.png" />
        <meta property="og:url" content="https://governance.vebetterdao.org" />
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
          <Navbar />
          <Container
            mt={10}
            mb={[20, 20, 40]}
            maxW={"container.xl"}
            minH="100vh"
            display={["flex"]}
            alignItems={["center"]}
            justifyContent={["flex-start"]}
            flexDirection={["column"]}>
            {children}
          </Container>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}
