"use client"

import { Flex, Spinner } from "@chakra-ui/react"
import dynamic from "next/dynamic"

const DashboardContent = dynamic(() => import("./DashboardContent"), {
  ssr: false,
  loading: () => (
    <Flex minH="100vh" align="center" justify="center">
      <Spinner size="lg" color="blue.solid" />
    </Flex>
  ),
})

export default function HomePage() {
  return <DashboardContent />
}
