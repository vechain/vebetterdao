import { Text, Card, CardBody, VStack, HStack, Box, SkeletonText, IconButton } from "@chakra-ui/react"
import React, { useCallback } from "react"
import {
  ProposalCreatedEvent,
  ProposalMetadata,
  ProposalState,
  useHasVoted,
  useIsDepositReached,
  useProposalState,
} from "@/api"
import { useIpfsMetadata } from "@/api/ipfs"
import { toIPFSURL } from "@/utils"
import { useProposalVoteDates } from "@/api/contracts/governance/hooks/useProposalVoteDates"
import StatusBadge from "@/components/Proposal/StatusBadge"
import { useTranslation } from "react-i18next"
import { useRouter } from "next/navigation"
import { FaAngleRight } from "react-icons/fa6"
import dayjs from "dayjs"
import { useWallet } from "@vechain/dapp-kit-react"

type Props = {
  proposal: ProposalCreatedEvent
}

export const ProposalCompactCard: React.FC<Props> = ({ proposal }) => {
  const { account } = useWallet()
  const { proposalId, description, roundIdVoteStart } = proposal
  const proposalMetadata = useIpfsMetadata<ProposalMetadata>(toIPFSURL(description))

  const router = useRouter()

  const { votingStartDate, votingEndDate } = useProposalVoteDates(proposalId)

  const { t } = useTranslation()

  const { data: proposalState } = useProposalState(proposalId)

  const { data: isDepositReached } = useIsDepositReached(proposalId)

  const goToProposal = useCallback(() => {
    router.push(`/proposals/${proposalId}`)
  }, [router, proposalId])

  const { data: hasVoted, isLoading: hasVotedLoading } = useHasVoted(proposal.proposalId, account ?? "")

  return (
    <Card
      variant={["baseWithBorder", "baseWithBorder", "filled"]}
      onClick={goToProposal}
      _hover={{ bg: "#F8F8F8" }}
      cursor={"pointer"}
      alignSelf={"flex-start"}
      w={"full"}>
      <CardBody>
        <HStack justifyContent={"space-between"} w="full">
          <VStack w="full" justifyContent={"space-between"} spacing={3} align={"flex-start"}>
            <Box>
              <StatusBadge type={proposalState ?? ProposalState.Pending} isDepositReached={isDepositReached} />
            </Box>
            <SkeletonText
              isLoaded={proposalMetadata.data !== undefined}
              noOfLines={3}
              flex={2.5}
              mr={{ base: 0, md: 10 }}
              alignSelf={"flex-start"}>
              <Text fontSize={"14px"} fontWeight={600}>
                {proposalMetadata.data?.title}
              </Text>
            </SkeletonText>
            <Text fontSize={"14px"} color={"gray.500"} fontWeight={400}>
              Starting {dayjs(votingStartDate).fromNow()}
            </Text>
          </VStack>
          <IconButton
            aria-label="Go to proposal"
            icon={<FaAngleRight />}
            onClick={goToProposal}
            variant={"link"}
            colorScheme="primary"
          />
        </HStack>
      </CardBody>
    </Card>
  )
}
