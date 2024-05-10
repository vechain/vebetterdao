import { useCurrentProposal } from "@/api"
import { AddressIcon } from "@/components/AddressIcon"
import { HStack, Skeleton, Text, VStack } from "@chakra-ui/react"

export const ProposalYourVote = () => {
  const { proposal } = useCurrentProposal()

  return (
    <VStack alignItems={"stretch"}>
      <Text fontWeight={"400"} color="#6A6A6A">
        Your vote
      </Text>
      <Skeleton isLoaded={!proposal.isProposerLoading}>
        <HStack>
          <AddressIcon address={proposal.proposer} rounded="full" h="20px" w="20px" />
        </HStack>
      </Skeleton>
    </VStack>
  )
}
