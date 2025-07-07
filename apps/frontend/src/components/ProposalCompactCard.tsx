import { Text, Card, CardBody, VStack, HStack, SkeletonText, IconButton, Skeleton } from "@chakra-ui/react"
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
          <Skeleton isLoaded={!isVotingStartDateLoading}>
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
    <Card
      variant={["filledSmall", "filledSmall", "filled"]}
      onClick={goToProposal}
      _hover={{ bg: "light-contrast-on-card-bg" }}
      cursor={"pointer"}
      alignSelf={"flex-start"}
      w={"full"}>
      <CardBody>
        <HStack justifyContent={"space-between"} w="full">
          <VStack w="full" justifyContent={"space-between"} spacing={3} align={"flex-start"}>
            <ProposalStatusBadge state={proposalState} />
            <VStack w="full" spacing={1} align={"flex-start"}>
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
              {!!account?.address && hasVotedText}
            </VStack>
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
