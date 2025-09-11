"use client"

import { MotionVStack } from "@/components"
import { AnalyticsUtils } from "@/utils"
import { Spinner, VStack } from "@chakra-ui/react"
import dynamic from "next/dynamic"
import { useEffect } from "react"

const StatsPageContent = dynamic(() => import("./components/StatsPageContent").then(mod => mod.StatsPageContent), {
  ssr: false,
  loading: () => (
    <VStack w="full" gap={12} h="80vh" justify="center">
      <Spinner size={"lg"} />
    </VStack>
  ),
})

export default function Profile() {
  useEffect(() => {
    AnalyticsUtils.trackPage("Profile")
  }, [])

  return (
    <MotionVStack>
      <StatsPageContent />
    </MotionVStack>
  )
}
