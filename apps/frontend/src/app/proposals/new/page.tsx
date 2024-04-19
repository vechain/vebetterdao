"use client"

import { MotionVStack } from "@/components"
import { AnalyticsUtils } from "@/utils"
import { Spinner, VStack } from "@chakra-ui/react"
import dynamic from "next/dynamic"
import { useEffect } from "react"

const NewProposalPageContent = dynamic(
  () => import("./components/NewProposalPageContent").then(mod => mod.NewProposalPageContent),
  {
    ssr: false,
    loading: () => (
      <VStack w="full" spacing={12} h="80vh" justify="center">
        <Spinner size={"lg"} />
      </VStack>
    ),
  },
)

export default function NewProposalPage() {
  useEffect(() => {
    AnalyticsUtils.trackPage("NewProposal")
  }, [])

  return (
    <MotionVStack>
      <NewProposalPageContent />
    </MotionVStack>
  )
}
