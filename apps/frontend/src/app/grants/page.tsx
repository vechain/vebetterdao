"use client"
import { Spinner, VStack } from "@chakra-ui/react"
import dynamic from "next/dynamic"
import { useEffect } from "react"

import AnalyticsUtils from "../../utils/AnalyticsUtils/AnalyticsUtils"
import { MotionVStack } from "../../components/MotionVStack"
const GrantsPageContent = dynamic(() => import("./components/GrantsPageContent").then(mod => mod.GrantsPageContent), {
  ssr: false,
  loading: () => (
    <VStack w="full" gap={12} h="80vh" justify="center">
      <Spinner size={"lg"} />
    </VStack>
  ),
})
export default function Grants() {
  useEffect(() => {
    AnalyticsUtils.trackPage(`Grants`)
  }, [])
  return (
    <MotionVStack>
      <GrantsPageContent />
    </MotionVStack>
  )
}
