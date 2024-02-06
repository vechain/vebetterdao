"use client"
// app/layout.tsx
import { Container } from "@chakra-ui/react"
import { Providers } from "./providers"

import { Navbar } from "@/components/Navbar/Navbar"
import dayjs from "dayjs"

import relativeTime from "dayjs/plugin/relativeTime"
dayjs.extend(relativeTime)

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Navbar />
          <Container
            mt={6}
            maxW={"container.xl"}
            minH="100vh"
            display={["flex"]}
            alignItems={["center"]}
            justifyContent={["flex-start"]}
            flexDirection={["column"]}>
            {children}
          </Container>
        </Providers>
      </body>
    </html>
  )
}
