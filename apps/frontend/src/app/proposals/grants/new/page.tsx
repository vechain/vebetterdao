"use client"

import { MotionVStack } from "@/components"
import { useMetProposalCriteria } from "@/api/contracts/governance"
import { AnalyticsUtils } from "@/utils"
import { Spinner, VStack } from "@chakra-ui/react"
import dynamic from "next/dynamic"
import { useEffect } from "react"

const GrantsNewPageContent = dynamic(
  () => import("./components/GrantsNewPageContent").then(mod => mod.GrantsNewPageContent),
  {
    ssr: false,
    loading: () => (
      <VStack w="full" gap={12} h="80vh" justify="center">
        <Spinner size={"lg"} />
      </VStack>
    ),
  },
)

export default function GrantsNew() {
  useEffect(() => {
    AnalyticsUtils.trackPage(`Grants New`)
  }, [])

  const metGrantCriteria = useMetProposalCriteria()

  // Show requirement modal if criteria not met
  if (!metGrantCriteria) return null

  return (
    <MotionVStack>
      <GrantsNewPageContent />
    </MotionVStack>
  )
}
