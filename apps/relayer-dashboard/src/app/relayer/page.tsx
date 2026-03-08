"use client"

import { Flex, Spinner, VStack } from "@chakra-ui/react"
import dynamic from "next/dynamic"

const ConnectedWallet = dynamic(
  () => import("@/components/ConnectedWallet").then(m => ({ default: m.ConnectedWallet })),
  {
    ssr: false,
    loading: () => (
      <Flex minH="40vh" align="center" justify="center">
        <Spinner size="lg" color="blue.solid" />
      </Flex>
    ),
  },
)

export default function RelayerPage() {
  return (
    <VStack w="full" gap={{ base: 4, md: 14 }} align="stretch">
      <ConnectedWallet />
    </VStack>
  )
}
