"use client"
import { VStack, Spinner } from "@chakra-ui/react"
import dynamic from "next/dynamic"
import { useEffect, use } from "react"
import { AnalyticsUtils } from "@/utils"

const ProposalPage = dynamic(() => import("./components/ProposalVote").then(mod => mod.ProposalVote), {
  ssr: false,
  loading: () => (
    <VStack w="full" spacing={12} h="80vh" justify="center">
      <Spinner size={"lg"} />
    </VStack>
  ),
})

type Props = {
  params: Promise<{
    proposalId: string
  }>
}

const ProposalPageContainer = (props: Readonly<Props>) => {
  const params = use(props.params)
  useEffect(() => {
    AnalyticsUtils.trackPage(`Proposal/${params.proposalId}`)
  }, [params.proposalId])

  return <ProposalPage proposalId={params.proposalId} />
}

export default ProposalPageContainer
