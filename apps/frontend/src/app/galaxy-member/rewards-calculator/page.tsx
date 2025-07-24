"use client"

import { MotionVStack } from "@/components"
import { AnalyticsUtils } from "@/utils"
import { Spinner, VStack } from "@chakra-ui/react"
import dynamic from "next/dynamic"
import { useEffect } from "react"

const RewardsCalculatorPageContent = dynamic(
  () => import("./components/GalaxyRewardsCalculator").then(mod => mod.GalaxyRewardsCalculator),
  {
    ssr: false,
    loading: () => (
      <VStack w="full" gap={12} h="80vh" justify="center">
        <Spinner size={"lg"} />
      </VStack>
    ),
  },
)

export default function NewProposalPage() {
  useEffect(() => {
    AnalyticsUtils.trackPage("GalaxyRewardsCalculator")
  }, [])

  return (
    <MotionVStack>
      <RewardsCalculatorPageContent />
    </MotionVStack>
  )
}
