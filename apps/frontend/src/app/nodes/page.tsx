"use client"
import { Spinner, VStack } from "@chakra-ui/react"
import dynamic from "next/dynamic"
import { useEffect } from "react"

import { MotionVStack } from "../../components/MotionVStack"
import AnalyticsUtils from "../../utils/AnalyticsUtils/AnalyticsUtils"

const NodesPageContent = dynamic(() => import("./components/NodesPageContent").then(mod => mod.NodesPageContent), {
  ssr: false,
  loading: () => (
    <VStack w="full" gap={12} h="80vh" justify="center">
      <Spinner size="lg" />
    </VStack>
  ),
})

export default function NodesPage() {
  useEffect(() => {
    AnalyticsUtils.trackPage("Nodes")
  }, [])
  return (
    <MotionVStack>
      <NodesPageContent />
    </MotionVStack>
  )
}
