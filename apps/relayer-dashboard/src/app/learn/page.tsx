"use client"

import { Flex, Spinner, VStack } from "@chakra-ui/react"
import dynamic from "next/dynamic"

const InfoContent = dynamic(() => import("@/components/InfoContent").then(m => ({ default: m.InfoContent })), {
  ssr: false,
  loading: () => (
    <Flex minH="40vh" align="center" justify="center">
      <Spinner size="lg" color="blue.solid" />
    </Flex>
  ),
})

export default function LearnPage() {
  return (
    <VStack w="full" gap={{ base: 4, md: 14 }} align="stretch">
      <InfoContent />
    </VStack>
  )
}
