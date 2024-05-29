"use client"

import { MotionVStack } from "@/components"
import { useProposalFormStore } from "@/store/useProposalFormStore"
import { AnalyticsUtils } from "@/utils"
import { Spinner, VStack } from "@chakra-ui/react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { useEffect, useLayoutEffect } from "react"

const NewProposalFormDetailsPageContent = dynamic(
  () => import("./components/NewProposalFormDetailsPageContent").then(mod => mod.NewProposalFormDetailsPageContent),
  {
    ssr: false,
    loading: () => (
      <VStack w="full" spacing={12} h="80vh" justify="center">
        <Spinner size={"lg"} />
      </VStack>
    ),
  },
)

export default function NewAppPageForm() {
  const router = useRouter()
  const { actions } = useProposalFormStore()
  useEffect(() => {
    AnalyticsUtils.trackPage("NewProposalFormDetailsPage")
  }, [])

  //redirect the user to the beginning of the form if the required data is missing
  // this happens in case the user tries to access this page directly
  useLayoutEffect(() => {
    if (!actions.length) {
      router.push("/proposals/new")
    }
  }, [actions, router])

  return (
    <MotionVStack>
      <NewProposalFormDetailsPageContent />
    </MotionVStack>
  )
}
