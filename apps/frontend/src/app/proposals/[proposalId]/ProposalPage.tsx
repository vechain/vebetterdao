"use client"
import { Spinner, VStack } from "@chakra-ui/react"
import dynamic from "next/dynamic"
import { useEffect } from "react"

import AnalyticsUtils from "../../../utils/AnalyticsUtils/AnalyticsUtils"
import { MotionVStack } from "../../../components/MotionVStack"
const ProposalPageContent = dynamic(
  () => import("./components/ProposalPageContent").then(mod => mod.ProposalPageContent),
  {
    ssr: false,
    loading: () => (
      <VStack w="full" gap={12} h="80vh" justify="center">
        <Spinner size={"lg"} />
      </VStack>
    ),
  },
)
type Props = {
  params: {
    proposalId: string
  }
}
export const ProposalPage = ({ params }: Props) => {
  useEffect(() => {
    AnalyticsUtils.trackPage("Proposals")
  }, [])
  return (
    <MotionVStack>
      <ProposalPageContent proposalId={params.proposalId} typeFilter="proposal" />
    </MotionVStack>
  )
}
