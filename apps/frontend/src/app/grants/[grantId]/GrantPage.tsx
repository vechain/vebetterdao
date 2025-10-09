"use client"
import { Spinner, VStack } from "@chakra-ui/react"
import dynamic from "next/dynamic"
import { useEffect } from "react"

import AnalyticsUtils from "../../../utils/AnalyticsUtils/AnalyticsUtils"
import { MotionVStack } from "../../../components/MotionVStack"
const GrantPageContent = dynamic(
  () => import("../../proposals/[proposalId]/components/ProposalPageContent").then(mod => mod.ProposalPageContent),
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
    grantId: string
  }
}
export const GrantPage = ({ params }: Readonly<Props>) => {
  useEffect(() => {
    AnalyticsUtils.trackPage("Grants")
  }, [])
  return (
    <MotionVStack>
      <GrantPageContent proposalId={params.grantId} typeFilter="grant" />
    </MotionVStack>
  )
}
