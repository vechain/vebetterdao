"use client"

import { MotionVStack } from "@/components"
import { AnalyticsUtils } from "@/utils"
import { Spinner, VStack } from "@chakra-ui/react"
import dynamic from "next/dynamic"
import { useEffect } from "react"

const NewProposalFundAndPublishPageContent = dynamic(
  () =>
    import("./components/NewProposalFundAndPublishPageContent").then(mod => mod.NewProposalFundAndPublishPageContent),
  {
    ssr: false,
    loading: () => (
      <VStack w="full" spacing={12} h="80vh" justify="center">
        <Spinner size={"lg"} />
      </VStack>
    ),
  },
)

export default function NewProposalFundAndPublishPage() {
  useEffect(() => {
    AnalyticsUtils.trackPage("NewProposal/fund-and-publish")
  }, [])

  return (
    <MotionVStack>
      <NewProposalFundAndPublishPageContent />
    </MotionVStack>
  )
}
