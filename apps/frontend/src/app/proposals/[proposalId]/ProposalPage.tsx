"use client"
import { Spinner, VStack } from "@chakra-ui/react"
import dynamic from "next/dynamic"
import { useEffect } from "react"

import { MotionVStack } from "../../../components/MotionVStack"
import AnalyticsUtils from "../../../utils/AnalyticsUtils/AnalyticsUtils"
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
  proposalId: string
}
export const ProposalPage = ({ proposalId }: Props) => {
  useEffect(() => {
    AnalyticsUtils.trackPage("Proposals")
  }, [])
  return (
    <MotionVStack>
      <ProposalPageContent proposalId={proposalId} typeFilter="proposal" />
    </MotionVStack>
  )
}
