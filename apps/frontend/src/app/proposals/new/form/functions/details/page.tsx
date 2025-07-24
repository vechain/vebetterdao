"use client"

import { MotionVStack } from "@/components"
import { AnalyticsUtils } from "@/utils"
import { Spinner, VStack } from "@chakra-ui/react"
import dynamic from "next/dynamic"
import { useEffect } from "react"

const NewProposalFormDetailsPageContent = dynamic(
  () => import("./components/NewProposalFormDetailsPageContent").then(mod => mod.NewProposalFormDetailsPageContent),
  {
    ssr: false,
    loading: () => (
      <VStack w="full" gap={12} h="80vh" justify="center">
        <Spinner size={"lg"} />
      </VStack>
    ),
  },
)

export default function NewProposalFormDetailsPage() {
  useEffect(() => {
    AnalyticsUtils.trackPage("NewProposalFormDetailsPage")
  }, [])

  return (
    <MotionVStack>
      <NewProposalFormDetailsPageContent />
    </MotionVStack>
  )
}
