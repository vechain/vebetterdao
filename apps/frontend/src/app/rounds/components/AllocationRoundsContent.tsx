import { useProposalsEvents, useActiveProposals, useIncomingProposals, usePastProposals, useCurrentBlock } from "@/api"
import { AllocationRoundsList, CreateProposalButton, ProposalCard, VoterRewards } from "@/components"
import { VStack, HStack, Stack } from "@chakra-ui/react"

export const AllocationRoundsContent = () => {
  return (
    <VStack w="full" spacing={12}>
      <Stack
        direction={["column-reverse", "column-reverse", "row"]}
        w="full"
        justify="space-between"
        align={["stretch", "stretch", "flex-start"]}
        spacing={18}>
        <HStack width="70%" flex={4} justifyContent="stretch" alignItems={"stretch"} spacing={4}>
          <AllocationRoundsList roundsPerPage={6} showLoadMore />
        </HStack>
        <VStack spacing={4} flex={2.5} position={["static", "static", "sticky"]} top={100} right={0}>
          <VoterRewards />
        </VStack>
      </Stack>
    </VStack>
  )
}
