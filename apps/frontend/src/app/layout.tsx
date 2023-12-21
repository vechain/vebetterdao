"use client"
// app/layout.tsx
import { Container } from "@chakra-ui/react"
import { Providers } from "./providers"

import { SideBar } from "@/components/Navbar"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Container
            maxW="container.xl"
            minH="100vh"
            display={["flex"]}
            alignItems={["center"]}
            justifyContent={["flex-start"]}
            flexDirection={["column", "row"]}>
            <SideBar />
            {children}
          </Container>
        </Providers>
      </body>
    </html>
  )
}
