"use client"
import { VStack, Spinner } from "@chakra-ui/react"
import dynamic from "next/dynamic"

const ProposalPage = dynamic(() => import("./components/ProposalVote").then(mod => mod.ProposalVote), {
  ssr: false,
  loading: () => (
    <VStack w="full" spacing={12} h="80vh" justify="center">
      <Spinner size={"lg"} />
    </VStack>
  ),
})

type Props = {
  params: {
    proposalId: string
  }
}

const ProposalPageContainer = ({ params }: Readonly<Props>) => {
  return <ProposalPage proposalId={params.proposalId} />
}

export default ProposalPageContainer
