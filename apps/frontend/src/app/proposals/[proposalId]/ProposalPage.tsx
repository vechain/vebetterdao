"use client"
import { Spinner, VStack } from "@chakra-ui/react"
import dynamic from "next/dynamic"
import { useEffect } from "react"

import { MotionVStack } from "../../../components/MotionVStack"
import AnalyticsUtils from "../../../utils/AnalyticsUtils/AnalyticsUtils"
import { ProposalDetail } from "../types"

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

type Props = { proposal: ProposalDetail }

export const ProposalPage = ({ proposal }: Props) => {
  useEffect(() => {
    AnalyticsUtils.trackPage("Proposals")
  }, [])
  return (
    <MotionVStack>
      <ProposalPageContent proposal={proposal} />
    </MotionVStack>
  )
}
