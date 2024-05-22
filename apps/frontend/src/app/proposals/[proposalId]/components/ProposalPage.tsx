import { HStack, VStack } from "@chakra-ui/react"
import { ProposalOverview } from "./ProposalOverview"
import { ProposalCommunitySupport } from "./ProposalCommunitySupport"
import { ProposalState, useCurrentProposal } from "@/api"

export const ProposalPage = () => {
  const { proposal } = useCurrentProposal()
  return (
    <VStack w="full" alignItems="stretch" gap={6}>
      <ProposalOverview />
      <HStack gap={8}>
        <VStack alignItems="stretch" flex={3}>
          {proposal.state === ProposalState.Pending && <ProposalCommunitySupport />}
        </VStack>
        <VStack alignItems="stretch" flex={1.5}></VStack>
      </HStack>
    </VStack>
  )
}
