"use client"
// app/layout.tsx
import { Container } from "@chakra-ui/react"
import { Providers } from "./providers"

import dayjs from "dayjs"

import relativeTime from "dayjs/plugin/relativeTime"
import { Footer } from "@/components"
import dynamic from "next/dynamic"

dayjs.extend(relativeTime)

const Navbar = dynamic(() => import("@/components/Navbar").then(mod => mod.Navbar), { ssr: false })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
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
