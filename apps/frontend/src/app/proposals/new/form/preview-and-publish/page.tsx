"use client"

import { MotionVStack } from "@/components"
import { AnalyticsUtils } from "@/utils"
import { Spinner, VStack } from "@chakra-ui/react"
import dynamic from "next/dynamic"
import { useEffect } from "react"

const PublishAndPreviewPageContent = dynamic(
  () => import("./components/PublishAndPreviewPageContent").then(mod => mod.PublishAndPreviewPageContent),
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
    AnalyticsUtils.trackPage("NewProposal/preview")
  }, [])

  return (
    <MotionVStack>
      <PublishAndPreviewPageContent />
    </MotionVStack>
  )
}
