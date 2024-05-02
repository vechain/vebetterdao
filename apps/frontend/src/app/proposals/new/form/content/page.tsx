"use client"

import { MotionVStack } from "@/components"
import { AnalyticsUtils } from "@/utils"
import { Spinner, VStack } from "@chakra-ui/react"
import dynamic from "next/dynamic"
import { useEffect } from "react"

const NewProposalPageDiscussionContent = dynamic(
  () => import("./components/NewProposalPageDiscussionContent").then(mod => mod.NewProposalPageDiscussionContent),
  {
    ssr: false,
    loading: () => (
      <VStack w="full" spacing={12} h="80vh" justify="center">
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
