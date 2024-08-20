import { Text, Card, CardBody, VStack, HStack, SkeletonText, IconButton, Skeleton } from "@chakra-ui/react"
import React, { useCallback, useMemo } from "react"
import { ProposalCreatedEvent, ProposalMetadata, ProposalState, useHasVoted, useProposalState } from "@/api"
import { useIpfsMetadata } from "@/api/ipfs"
import { toIPFSURL } from "@/utils"
import { useProposalVoteDates } from "@/api/contracts/governance/hooks/useProposalVoteDates"
import { useTranslation } from "react-i18next"
import { useRouter } from "next/navigation"
import { FaAngleRight } from "react-icons/fa6"
import dayjs from "dayjs"
import { useWallet } from "@vechain/dapp-kit-react"
import { ProposalStatusBadge } from "@/app/proposals/[proposalId]/components/ProposalOverview/components/ProposalStatusBadge"

type Props = {
  proposal: ProposalCreatedEvent
}

export const ProposalCompactCard: React.FC<Props> = ({ proposal }) => {
  const { account } = useWallet()
  const { proposalId, description } = proposal
  const proposalMetadata = useIpfsMetadata<ProposalMetadata>(toIPFSURL(description))

  const router = useRouter()

  const { votingStartDate, isVotingStartDateLoading } = useProposalVoteDates(proposalId)

  const { t } = useTranslation()

  const { data: proposalState } = useProposalState(proposalId)

  const goToProposal = useCallback(() => {
    router.push(`/proposals/${proposalId}`)
  }, [router, proposalId])

  const { data: hasVoted, isLoading: hasVotedLoading } = useHasVoted(proposal.proposalId, account ?? "")

  const hasVotedText = useMemo(() => {
    switch (proposalState) {
      case ProposalState.Pending:
        return t("Starting {{date}}", { date: dayjs(votingStartDate).format("MMM D, YYYY") })
      case ProposalState.Canceled:
        return t("Vote didn't start")
      case ProposalState.DepositNotMet:
        return t("Vote didn't start")
      case ProposalState.Active:
        return hasVoted ? t("You have voted") : t("You didn't vote yet")
      case ProposalState.Executed:
        return hasVoted ? t("You have voted") : t("You haven't voted")
      case ProposalState.Defeated:
        return hasVoted ? t("You have voted") : t("You haven't voted")
      case ProposalState.Succeeded:
        return hasVoted ? t("You have voted") : t("You haven't voted")
      case ProposalState.Queued:
        return hasVoted ? t("You have voted") : t("You haven't voted")
      default:
        return ""
    }
  }, [votingStartDate, proposalState, t, hasVoted])

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
            <ProposalStatusBadge
              proposalId={proposal.proposalId}
              containerProps={{
                py: 1,
                px: 2,
              }}
            />
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
            <Skeleton isLoaded={!isVotingStartDateLoading && !hasVotedLoading}>
              <Text fontSize={"14px"} color={"gray.500"} fontWeight={400}>
                {hasVotedText}
              </Text>
            </Skeleton>
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
