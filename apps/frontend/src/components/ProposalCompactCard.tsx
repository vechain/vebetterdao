import { Text, Card, VStack, HStack, Skeleton, IconButton, LinkBox, LinkOverlay } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import dayjs from "dayjs"
import NextLink from "next/link"
import React, { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { FaAngleRight } from "react-icons/fa6"

import { ProposalMetadata } from "../api/contracts/governance/getProposalsEvents"
import { useProposalInteractionDates } from "../api/contracts/governance/hooks/useProposalInteractionDates"
import { useIpfsMetadata } from "../api/ipfs/hooks/useIpfsMetadata"
import { ProposalEnriched, ProposalState } from "../hooks/proposals/grants/types"
import { toIPFSURL } from "../utils/ipfs"

import { ProposalStatusBadge } from "./Proposal/ProposalStatusBadge"
import { ProposalYourVote } from "./Proposal/ProposalYourVote"

type Props = {
  proposal: ProposalEnriched
  proposalState?: ProposalState
}
export const ProposalCompactCard: React.FC<Props> = ({ proposal, proposalState }) => {
  const { account } = useWallet()
  const { id: proposalId, ipfsDescription } = proposal
  const proposalMetadata = useIpfsMetadata<ProposalMetadata>(toIPFSURL(ipfsDescription))
  const { supportEndDate } = useProposalInteractionDates(proposalId)
  const { t } = useTranslation()
  const proposalExtraInfo = useMemo(() => {
    if (proposal.state === ProposalState.Pending) {
      return (
        <Skeleton loading={!supportEndDate}>
          <Text textStyle="sm" color={"gray.500"}>
            {t("Starting {{date}}", { date: dayjs(supportEndDate).format("MMM D, YYYY") })}
          </Text>
        </Skeleton>
      )
    }
    if (proposal.state === ProposalState.DepositNotMet) {
      return (
        <Text textStyle="sm" color={"gray.500"}>
          {t("Vote didn't start")}
        </Text>
      )
    }
    if (
      !!account?.address &&
      [ProposalState.Active, ProposalState.Executed, ProposalState.Queued].includes(proposal.state as ProposalState)
    ) {
      return (
        <ProposalYourVote
          proposalId={proposalId}
          proposalState={proposal.state}
          renderTitle={false}
          textProps={{ color: "gray.500", fontSize: "14px" }}
        />
      )
    }
  }, [proposal.state, account?.address, supportEndDate, t, proposalId])

  return (
    <LinkBox asChild>
      <Card.Root
        variant="subtle"
        rounded="lg"
        data-testid={`proposal-compact-card-#${proposalId}`}
        alignSelf={"flex-start"}
        w={"full"}
        p="4">
        <LinkOverlay asChild>
          <NextLink href={`proposals/${proposalId}`}>
            <Card.Body p="0">
              <HStack justifyContent={"space-between"} w="full">
                <VStack w="full" justifyContent={"space-between"} gap="3" align={"flex-start"}>
                  <ProposalStatusBadge proposalId={proposal.id} proposalState={proposalState} />
                  <VStack w="full" gap="1" align={"flex-start"}>
                    <Skeleton
                      loading={proposalMetadata.isLoading}
                      lineClamp={3}
                      flex={2.5}
                      mr={{ base: 0, md: 10 }}
                      alignSelf={"flex-start"}>
                      <VStack alignItems="flex-start">
                        <Text textStyle={"sm"} fontWeight="semibold">
                          {proposalMetadata.data?.title}
                        </Text>
                        {proposalExtraInfo}
                      </VStack>
                    </Skeleton>
                  </VStack>
                </VStack>
                <IconButton aria-label="Go to proposal" variant="ghost">
                  <FaAngleRight />
                </IconButton>
              </HStack>
            </Card.Body>
          </NextLink>
        </LinkOverlay>
      </Card.Root>
    </LinkBox>
  )
}
