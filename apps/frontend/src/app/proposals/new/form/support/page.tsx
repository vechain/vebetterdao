"use client"
import { Spinner, VStack } from "@chakra-ui/react"
import dynamic from "next/dynamic"
import { useEffect } from "react"

import AnalyticsUtils from "../../../../../utils/AnalyticsUtils/AnalyticsUtils"
import { MotionVStack } from "../../../../../components/MotionVStack"
const NewProposalFundAndPublishPageContent = dynamic(
  () => import("./components/NewProposalSupportPageContent").then(mod => mod.NewProposalSupportPageContent),
  {
    ssr: false,
    loading: () => (
      <VStack w="full" gap={12} h="80vh" justify="center">
        <Spinner size={"lg"} />
      </VStack>
    ),
  },
)
export default function NewProposalFundAndPublishPage() {
  useEffect(() => {
    AnalyticsUtils.trackPage("NewProposal/support")
  }, [])
  return (
    <MotionVStack>
      <NewProposalFundAndPublishPageContent />
    </MotionVStack>
  )
}
