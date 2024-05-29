"use client"

import { MotionVStack } from "@/components"
import { useProposalFormStore } from "@/store/useProposalFormStore"
import { AnalyticsUtils } from "@/utils"
import { Spinner, VStack } from "@chakra-ui/react"
import dynamic from "next/dynamic"
import { useRouter } from "next/router"
import { useEffect, useLayoutEffect, useMemo } from "react"

const NewProposalRoundPageContent = dynamic(
  () => import("./components/NewProposalRoundPageContent").then(mod => mod.NewProposalRoundPageContent),
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
  const router = useRouter()
  const { title, shortDescription, markdownDescription } = useProposalFormStore()

  useEffect(() => {
    AnalyticsUtils.trackPage("NewProposal/round")
  }, [])

  //redirect the user to the beginning of the form if the required data is missing
  // this happens in case the user tries to access this page directly

  const isVisitAuthorized = useMemo(
    () => !!title && !!shortDescription && !!markdownDescription,
    [title, shortDescription, markdownDescription],
  )
  useLayoutEffect(() => {
    if (!isVisitAuthorized) {
      router.push("/proposals/new")
    }
  }, [isVisitAuthorized, router])

  if (!isVisitAuthorized) return null

  return (
    <MotionVStack>
      <NewProposalRoundPageContent />
    </MotionVStack>
  )
}
