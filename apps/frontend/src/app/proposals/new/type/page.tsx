"use client"
import { Spinner, VStack } from "@chakra-ui/react"
import dynamic from "next/dynamic"
import { useEffect } from "react"

import AnalyticsUtils from "../../../../utils/AnalyticsUtils/AnalyticsUtils"
import { MotionVStack } from "../../../../components/MotionVStack"
const NewProposalTypePageContent = dynamic(
  () => import("./components/NewProposalTypePageContent").then(mod => mod.NewProposalTypePageContent),
  {
    ssr: false,
    loading: () => (
      <VStack w="full" gap={12} h="80vh" justify="center">
        <Spinner size={"lg"} />
      </VStack>
    ),
  },
)
export default function NewProposalTypePage() {
  useEffect(() => {
    AnalyticsUtils.trackPage("NewProposal/Type")
  }, [])
  return (
    <MotionVStack>
      <NewProposalTypePageContent />
    </MotionVStack>
  )
}
