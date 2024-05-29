"use client"

import { MotionVStack } from "@/components"
import { useProposalFormStore } from "@/store/useProposalFormStore"
import { AnalyticsUtils } from "@/utils"
import { Spinner, VStack } from "@chakra-ui/react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { useEffect, useLayoutEffect } from "react"

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
  const router = useRouter()
  const { title, shortDescription, markdownDescription, votingStartRoundId } = useProposalFormStore()
  useEffect(() => {
    AnalyticsUtils.trackPage("NewProposal/fund-and-publish")
  }, [])

  //redirect the user to the beginning of the form if the required data is missing
  // this happens in case the user tries to access this page directly
  useLayoutEffect(() => {
    if (!title || !shortDescription || !markdownDescription || !votingStartRoundId) {
      router.push("/proposals/new")
    }
  }, [title, shortDescription, markdownDescription, votingStartRoundId, router])

  return (
    <MotionVStack>
      <NewProposalFundAndPublishPageContent />
    </MotionVStack>
  )
}
