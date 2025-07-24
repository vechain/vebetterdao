"use client"

import { MotionVStack } from "@/components"
import { AnalyticsUtils } from "@/utils"
import { Spinner, VStack } from "@chakra-ui/react"
import dynamic from "next/dynamic"
import { useEffect } from "react"

const NewProposalRoundPageContent = dynamic(
  () => import("./components/NewProposalRoundPageContent").then(mod => mod.NewProposalRoundPageContent),
  {
    ssr: false,
    loading: () => (
      <VStack w="full" gap={12} h="80vh" justify="center">
        <Spinner size={"lg"} />
      </VStack>
    ),
  },
)

export default function NewProposalRoundPage() {
  useEffect(() => {
    AnalyticsUtils.trackPage("NewProposal/round")
  }, [])

  return (
    <MotionVStack>
      <NewProposalRoundPageContent />
    </MotionVStack>
  )
}
