"use client"
import { VStack, Spinner } from "@chakra-ui/react"
import dynamic from "next/dynamic"

const ProposalPageContent = dynamic(
  () => import("./components/ProposalPageContent").then(mod => mod.ProposalPageContent),
  {
    ssr: false,
    loading: () => (
      <VStack w="full" spacing={12} h="80vh" justify="center">
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

export default function ProposalPage({ params }: Readonly<Props>) {
  return <ProposalPageContent proposalId={params.proposalId} />
}

export default ProposalPageContainer
