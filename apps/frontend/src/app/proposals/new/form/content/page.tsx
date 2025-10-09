"use client"
import { Spinner, VStack } from "@chakra-ui/react"
import dynamic from "next/dynamic"
import { useEffect } from "react"

import { MotionVStack } from "../../../../../components/MotionVStack"
import AnalyticsUtils from "../../../../../utils/AnalyticsUtils/AnalyticsUtils"
const NewProposalPageDiscussionContent = dynamic(
  () => import("./components/NewProposalPageDiscussionContent").then(mod => mod.NewProposalPageDiscussionContent),
  {
    ssr: false,
    loading: () => (
      <VStack w="full" gap={12} h="80vh" justify="center">
        <Spinner size={"lg"} />
      </VStack>
    ),
  },
)
export default function NewProposalPageDiscussion() {
  useEffect(() => {
    AnalyticsUtils.trackPage("NewProposalPageDiscussionContent")
  }, [])
  return (
    <MotionVStack>
      <NewProposalPageDiscussionContent />
    </MotionVStack>
  )
}
