"use client"
import { Spinner, VStack } from "@chakra-ui/react"
import dynamic from "next/dynamic"
import { useEffect } from "react"

import { MotionVStack } from "../../components/MotionVStack"
import AnalyticsUtils from "../../utils/AnalyticsUtils/AnalyticsUtils"
const AppsPageContent = dynamic(() => import("./components/AppsPageContent").then(mod => mod.AppsPageContent), {
  ssr: false,
  loading: () => (
    <VStack w="full" gap={12} h="80vh" justify="center">
      <Spinner size={"lg"} />
    </VStack>
  ),
})
export default function AppsPage() {
  useEffect(() => {
    AnalyticsUtils.trackPage("Apps")
  }, [])
  return (
    <MotionVStack>
      <AppsPageContent />
    </MotionVStack>
  )
}
