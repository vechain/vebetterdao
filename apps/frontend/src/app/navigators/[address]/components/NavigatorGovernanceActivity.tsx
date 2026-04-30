import { SimpleGrid, VStack } from "@chakra-ui/react"

import { NavigatorCreatedProposalsCard } from "./NavigatorCreatedProposalsCard"
import { NavigatorRoundVotesCard } from "./NavigatorRoundVotesCard"
import { NavigatorVotedProposalsCard } from "./NavigatorVotedProposalsCard"

type Props = {
  address: string
}

export const NavigatorGovernanceActivity = ({ address }: Props) => {
  return (
    <VStack gap={4} w="full">
      <SimpleGrid columns={{ base: 1, md: 3 }} gap={4} w="full" alignItems="stretch">
        <NavigatorRoundVotesCard address={address} />
        <NavigatorVotedProposalsCard address={address} />
        <NavigatorCreatedProposalsCard address={address} />
      </SimpleGrid>
    </VStack>
  )
}
