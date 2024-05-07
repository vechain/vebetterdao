import { Divider, Flex, HStack, Heading, IconButton, Spacer, Text, VStack } from "@chakra-ui/react"
import { BaseCard } from "../../../components/BaseCard"
import { humanAddress } from "@repo/utils/FormattingUtils"
import { AddressIcon } from "@/components/AddressIcon"
import { FaRegBell, FaRegClock, FaShareNodes } from "react-icons/fa6"
import { VOT3Icon } from "@/components"
import { useCurrentProposal } from "@/api"
import { ProposalOverviewVotes } from "./components/ProposalOverviewVotes"
import { timestampToTimeLeftCompact } from "@/utils"

export const ProposalOverview = () => {
  // TODO: abstract quorum not reached
  // TODO: abstract upcoming voting
  // TODO: abstract starts in
  // TODO: add cast your vote button

  // ask erik about the following:
  // TODO: should the round be the current round or the start voting round?
  // TODO: should we move colors variables to theme?
  // TODO: is there i18n?
  // TODO: font-size should be in theme?
  // TODO: how to handle notify button?
  // TODO: how to handle share button?
  // TODO: icons are different (vot3, warning and share)

  const { proposal } = useCurrentProposal()

  return (
    <BaseCard>
      <Flex gap="48px">
        <VStack gap={"20px"} alignItems={"stretch"} flex={3}>
          <VStack alignItems={"stretch"}>
            <Text fontWeight={"600"} color="#6A6A6A">
              ROUND #{proposal.roundIdVoteStart}
            </Text>
            <Heading fontWeight={700} fontSize="36px" color="#252525">
              {proposal.title}
            </Heading>
            <Text fontWeight={"600"} color={proposal.isDepositPending ? "#F29B32" : "#6194F5"}>
              {proposal.isDepositPending ? "VOT3 deposit pending" : "Upcoming voting"}
            </Text>
            <Spacer h={"24px"} />
            <Text color="#252525">{proposal.description}</Text>
          </VStack>
          <Divider color="#D5D5D5" />
          <HStack justify={"space-between"}>
            <HStack gap={"48px"}>
              <VStack alignItems={"stretch"}>
                <Text fontWeight={"400"} color="#6A6A6A">
                  Created by
                </Text>
                <HStack>
                  <AddressIcon address={proposal.proposer} rounded="full" h="20px" w="20px" />
                  <Text color="#252525">{humanAddress(proposal.proposer, 7, 5)}</Text>
                </HStack>
              </VStack>
              <VStack alignItems={"stretch"}>
                <Text fontWeight={"400"} color="#6A6A6A">
                  Starts in
                </Text>
                <HStack>
                  <FaRegClock />
                  <Text color="#252525">{timestampToTimeLeftCompact(proposal.startsInDate)}</Text>
                </HStack>
              </VStack>
              <VStack alignItems={"stretch"}>
                <Text fontWeight={"400"} color="#6A6A6A">
                  VOT3 deposit
                </Text>
                <HStack gap={0}>
                  <VOT3Icon h="20px" w="20px" />
                  <Text color="#6A6A6A" display={"inline-flex"} ml={2}>
                    {proposal.deposited}
                  </Text>
                  <Text color="#252525">/{proposal.depositThreshold}</Text>
                </HStack>
              </VStack>
            </HStack>
            <HStack>
              <IconButton aria-label="notify" rounded="full" bgColor="#E0E9FE" color="#004CFC" h="40px" w="40px">
                <FaRegBell size="20px" />
              </IconButton>
              <IconButton aria-label="share" rounded="full" bgColor="#E0E9FE" color="#004CFC" h="40px" w="40px">
                <FaShareNodes size="20px" />
              </IconButton>
            </HStack>
          </HStack>
        </VStack>
        <ProposalOverviewVotes />
      </Flex>
    </BaseCard>
  )
}
