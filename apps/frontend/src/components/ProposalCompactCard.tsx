import { Text, Card, VStack, HStack, Skeleton, IconButton } from "@chakra-ui/react"
import React, { useCallback, useMemo } from "react"
import { ProposalMetadata } from "@/api"
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
import { ProposalEnriched, ProposalState } from "@/hooks/proposals/grants/types"

type Props = {
  proposal: ProposalEnriched
  proposalState?: ProposalState
}

export const ProposalCompactCard: React.FC<Props> = ({ proposal, proposalState }) => {
  const { account } = useWallet()
  const { id, description } = proposal
  const proposalMetadata = useIpfsMetadata<ProposalMetadata>(toIPFSURL(description ?? ""))

  const router = useRouter()

  const { votingStartDate, isVotingStartDateLoading } = useProposalVoteDates(id)

  const { t } = useTranslation()

  const goToProposal = useCallback(() => {
    router.push(`/proposals/${id}`)
  }, [router, id])

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
            proposalId={id}
            proposalState={proposalState}
            renderTitle={false}
            textProps={{ color: "gray.500", fontSize: "14px" }}
          />
        )
      default:
        return ""
    }
  }, [votingStartDate, proposalState, t, isVotingStartDateLoading, id])

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
              proposalState={proposalState}
              isDepositReached={false} //TODO: Implement this, fix the type expected
              containerProps={{
                py: 1,
                px: 2,
              }}
              proposalType={proposal.type}
            />
            <VStack w="full" gap={1} align={"flex-start"}>
              <Skeleton
                loading={proposalMetadata.isLoading}
                lineClamp={3}
                flex={2.5}
                mr={{ base: 0, md: 10 }}
                alignSelf={"flex-start"}>
                <Text fontSize={"14px"} fontWeight={600}>
                  {proposalMetadata.data?.title}
                </Text>
              </Skeleton>
              {!!account?.address && hasVotedText}
            </VStack>
          </VStack>
          <IconButton aria-label="Go to proposal" onClick={goToProposal} variant="ghost" colorPalette="primary">
            <FaAngleRight />
          </IconButton>
        </HStack>
      </Card.Body>
    </Card.Root>
  )
}
