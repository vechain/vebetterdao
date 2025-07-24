import { Text, Card, VStack, HStack, SkeletonText, IconButton, Skeleton } from "@chakra-ui/react"
import React, { useCallback, useMemo } from "react"
import { ProposalCreatedEvent, ProposalMetadata, ProposalState } from "@/api"
import { useIpfsMetadata } from "@/api/ipfs"
import { toIPFSURL } from "@/utils"
import { useProposalVoteDates } from "@/api/contracts/governance/hooks/useProposalVoteDates"
import { useTranslation } from "react-i18next"
import { useRouter } from "next/navigation"
import { FaAngleRight } from "react-icons/fa6"
import dayjs from "dayjs"
import { useWallet } from "@vechain/vechain-kit"
import { ProposalStatusBadge } from "./Proposal/ProposalStatusBadge"
import { ProposalYourVote } from "./Proposal/ProposalYourVote"

type Props = {
  proposal: ProposalCreatedEvent
  proposalState?: ProposalState
}

export const ProposalCompactCard: React.FC<Props> = ({ proposal, proposalState }) => {
  const { account } = useWallet()
  const { proposalId, description } = proposal
  const proposalMetadata = useIpfsMetadata<ProposalMetadata>(toIPFSURL(description))

  const router = useRouter()

  const { votingStartDate, isVotingStartDateLoading } = useProposalVoteDates(proposalId)

  const { t } = useTranslation()

  const goToProposal = useCallback(() => {
    router.push(`/proposals/${proposalId}`)
  }, [router, proposalId])

  const hasVotedText = useMemo(() => {
    switch (proposalState) {
      case ProposalState.Pending:
        return (
          <Skeleton loading={isVotingStartDateLoading}>
            <Text fontSize={"14px"} color={"gray.500"} fontWeight={400}>
              {t("Starting {{date}}", { date: dayjs(votingStartDate).format("MMM D, YYYY") })}
            </Text>
          </Skeleton>
        )
      case ProposalState.Canceled:
      case ProposalState.DepositNotMet:
        return (
          <Text fontSize={"14px"} color={"gray.500"} fontWeight={400}>
            {t("Vote didn't start")}
          </Text>
        )
      case ProposalState.Active:
      case ProposalState.Executed:
      case ProposalState.Defeated:
      case ProposalState.Succeeded:
      case ProposalState.Queued:
        return (
          <ProposalYourVote
            proposalId={proposalId}
            proposalState={proposalState}
            renderTitle={false}
            textProps={{ color: "gray.500", fontSize: "14px" }}
          />
        )
      default:
        return ""
    }
  }, [votingStartDate, proposalState, t, isVotingStartDateLoading, proposalId])

  return (
    <Card.Root
      variant={["filledSmall", "filledSmall", "filled"]}
      onClick={goToProposal}
      _hover={{ bg: "light-contrast-on-card-bg" }}
      cursor={"pointer"}
      alignSelf={"flex-start"}
      w={"full"}>
      <Card.Body>
        <HStack justifyContent={"space-between"} w="full">
          <VStack w="full" justifyContent={"space-between"} gap={3} align={"flex-start"}>
            <ProposalStatusBadge
              proposalId={proposal.proposalId}
              proposalState={proposalState}
              containerProps={{
                py: 1,
                px: 2,
              }}
            />
            <VStack w="full" gap={1} align={"flex-start"}>
              <SkeletonText
                loading={proposalMetadata.isLoading}
                lineClamp={3}
                flex={2.5}
                mr={{ base: 0, md: 10 }}
                alignSelf={"flex-start"}>
                <Text fontSize={"14px"} fontWeight={600}>
                  {proposalMetadata.data?.title}
                </Text>
              </SkeletonText>
              {!!account?.address && hasVotedText}
            </VStack>
          </VStack>
          <IconButton aria-label="Go to proposal" onClick={goToProposal} variant={"link"} colorScheme="primary">
            <FaAngleRight />
          </IconButton>
        </HStack>
      </Card.Body>
    </Card.Root>
  )
}
