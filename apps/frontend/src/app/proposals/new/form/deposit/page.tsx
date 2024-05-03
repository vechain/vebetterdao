"use client"

import { MotionVStack } from "@/components"
import { AnalyticsUtils } from "@/utils"
import { Spinner, VStack } from "@chakra-ui/react"
import dynamic from "next/dynamic"
import { useEffect } from "react"

const NewProposalDepositPageContent = dynamic(
  () => import("./components/NewProposalDepositPageContent").then(mod => mod.NewProposalDepositPageContent),
  {
    ssr: false,
    loading: () => (
      <VStack w="full" spacing={12} h="80vh" justify="center">
        <Spinner size={"lg"} />
      </VStack>
    ),
  },
)

export default function NewProposalRoundPage() {
  useEffect(() => {
    AnalyticsUtils.trackPage("NewProposal/deposit")
  }, [])

  return (
    <MotionVStack>
      <NewProposalDepositPageContent />
    </MotionVStack>
  )
}
