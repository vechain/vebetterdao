import { Divider, Flex, HStack, Heading, IconButton, Image, Spacer, Text, VStack } from "@chakra-ui/react"
import { BaseCard } from "../../../components/BaseCard"
import { humanAddress } from "@repo/utils/FormattingUtils"
import { AddressIcon } from "@/components/AddressIcon"
import { useCurrentProposal } from "@/api"
import { ProposalOverviewVotes } from "./components/ProposalOverviewVotes"
import { UilShareAlt } from "@iconscout/react-unicons"
import { ProposalOverviewTime } from "./components/ProposalOverviewTime"
import { ProposalOverviewStatusLabel } from "./components/ProposalOverviewStatusLabel"
import { ProposalOverviewSupport } from "./components/ProposalOverviewSupport"

export const ProposalOverview = () => {
  // TODO: loaders
  // TODO: check theme and colors?
  // TODO: is there i18n?
  // TODO: font-size should be in theme?
  // TODO: change different icons (vot3, warning and share)
  // TODO: adapt to the last iteration of the design
  // TODO: get the right data for the proposal
  // TODO: cast vote
  // TODO: bind information for ProposalVotesResults

  // waiting designers
  // TODO: how to handle share button? (Waiting for design)

  const { proposal } = useCurrentProposal()

  return (
    <BaseCard>
      <Flex gap="48px" flexDir={["column", "column", "row"]}>
        <VStack gap={"20px"} alignItems={"stretch"} flex={3} justify={"space-between"}>
          <VStack alignItems={"stretch"}>
            <Text fontWeight={"600"} color="#6A6A6A">
              ROUND #{proposal.roundIdVoteStart}
            </Text>
            <Heading fontWeight={700} fontSize="36px" color="#252525">
              {proposal.title}
            </Heading>
            <ProposalOverviewStatusLabel />
            <Spacer h={"24px"} />
            <Text color="#252525">{proposal.description}</Text>
          </VStack>
          <VStack alignItems={"stretch"}>
            <Divider color="#D5D5D5" />
            <HStack justify={"space-between"} flexWrap={"wrap"}>
              <VStack alignItems={"stretch"}>
                <Text fontWeight={"400"} color="#6A6A6A">
                  Created by
                </Text>
                <HStack>
                  <AddressIcon address={proposal.proposer} rounded="full" h="20px" w="20px" />
                  <Text color="#252525">{humanAddress(proposal.proposer, 7, 5)}</Text>
                </HStack>
              </VStack>
              <ProposalOverviewTime />
              <ProposalOverviewSupport />
              <IconButton aria-label="share" rounded="full" bgColor="#E0E9FE" color="#004CFC" h="40px" w="40px">
                <UilShareAlt size="20px" />
              </IconButton>
            </HStack>
          </VStack>
        </VStack>
        <ProposalOverviewVotes />
      </Flex>
    </BaseCard>
  )
}
