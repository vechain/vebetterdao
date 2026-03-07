"use client"

import { Container, Flex, VStack } from "@chakra-ui/react"
import dynamic from "next/dynamic"

import { NavigationProvider } from "@/hooks/useNavigation"

import { Providers } from "./providers"

const Navbar = dynamic(() => import("@/components/Navbar").then(mod => mod.Navbar), {
  ssr: false,
})

export function ClientApp({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <NavigationProvider>
        <VStack minH="100vh" gap={0} align="stretch">
          <Navbar />
          <Flex flex={1}>
            <Container
              flex={1}
              my={{ base: 4, md: 10 }}
              px={4}
              maxW="breakpoint-xl"
              display="flex"
              alignItems="center"
              justifyContent="flex-start"
              flexDirection="column">
              {children}
            </Container>
          </Flex>
        </VStack>
      </NavigationProvider>
    </Providers>
  )
}
