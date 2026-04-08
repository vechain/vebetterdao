import { Heading, SimpleGrid, VStack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

import { useUserVotesInAllRounds } from "@/api/contracts/xApps/hooks/useUserVotesInAllRounds"
import { useUserCreatedProposal } from "@/hooks/proposals/common/useUserCreatedProposal"

import { NavigatorCreatedProposalsCard } from "./NavigatorCreatedProposalsCard"
import { NavigatorRoundVotesCard } from "./NavigatorRoundVotesCard"
import { NavigatorTopVotedAppsCard } from "./NavigatorTopVotedAppsCard"
import { NavigatorVotedProposalsCard } from "./NavigatorVotedProposalsCard"

type Props = {
  address: string
}

export const NavigatorGovernanceActivity = ({ address }: Props) => {
  const { t } = useTranslation()
  const { data: createdProposals } = useUserCreatedProposal(address)
  const { data: voteEvents } = useUserVotesInAllRounds(address)

  const hasCreatedProposals = !!createdProposals && createdProposals.length > 0
  const hasRoundVotes = !!voteEvents && voteEvents.length > 0

  return (
    <VStack gap={6} w="full">
      <Heading w="full" size={{ base: "lg", md: "xl" }} fontWeight={"bold"}>
        {t("Governance Activity")}
      </Heading>
      <SimpleGrid columns={{ base: 1, md: hasCreatedProposals ? 2 : 1 }} gap={6} w="full" alignItems="stretch">
        <NavigatorVotedProposalsCard address={address} />
        <NavigatorCreatedProposalsCard address={address} />
      </SimpleGrid>

      <Heading w="full" size={{ base: "lg", md: "xl" }} fontWeight="bold">
        {t("Apps Voting Activity")}
      </Heading>
      <SimpleGrid columns={{ base: 1, md: hasRoundVotes ? 2 : 1 }} gap={6} w="full" alignItems="stretch">
        <NavigatorRoundVotesCard address={address} />
        <NavigatorTopVotedAppsCard address={address} />
      </SimpleGrid>
    </VStack>
  )
}
