"use client"

import { Badge, Button, Heading, HStack, Text, VStack } from "@chakra-ui/react"
import { ethers } from "ethers"
import NextLink from "next/link"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { FiArrowUpRight } from "react-icons/fi"

import { useProposalState } from "@/api/contracts/governance/hooks/useProposalState"
import {
  mapSupportToVoteType,
  useUserProposalsVoteEvents,
} from "@/api/contracts/governance/hooks/useUserProposalsVoteEvents"
import { BaseModal } from "@/components/BaseModal"
import { ProposalStatusBadge } from "@/components/Proposal/ProposalStatusBadge"
import { useProposalEnrichedById } from "@/hooks/proposals/common/useProposalEnrichedById"
import { VoteType } from "@/types/voting"

type Props = {
  isOpen: boolean
  onClose: () => void
  proposalId: string
  navigatorAddress: string
}

export const NavigatorProposalVoteModal = ({ isOpen, onClose, proposalId, navigatorAddress }: Props) => {
  const { t } = useTranslation()
  const { data: proposal, isLoading: proposalLoading } = useProposalEnrichedById(proposalId)
  const { data: proposalState } = useProposalState(proposalId)

  const { data: allVoteEvents, isLoading: voteLoading } = useUserProposalsVoteEvents(navigatorAddress)

  const vote = useMemo(() => {
    if (!allVoteEvents || !proposalId) return null
    const event = allVoteEvents.find(e => e.proposalId.toString() === proposalId)
    if (!event) return null
    return {
      voteType: mapSupportToVoteType(event.support),
      power: event.power ? ethers.formatEther(event.power.toString()) : undefined,
      reason: (event.reason as string) ?? "",
    }
  }, [allVoteEvents, proposalId])

  const isLoading = proposalLoading || voteLoading

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} ariaTitle={proposal?.title ?? t("Proposal")} showCloseButton>
      <VStack gap={4} align="stretch" py={4} px={2}>
        {isLoading ? (
          <Text textStyle="sm" color="text.subtle">
            {t("Loading...")}
          </Text>
        ) : (
          <>
            <HStack gap={2} flexWrap="wrap">
              <ProposalStatusBadge
                proposalId={proposalId}
                proposalState={proposalState}
                badgeProps={{ textStyle: "xs" }}
              />
              {vote?.voteType === VoteType.VOTE_FOR && (
                <Badge variant="positive" rounded="full" textStyle="xs">
                  {t("Voted for")}
                </Badge>
              )}
              {vote?.voteType === VoteType.VOTE_AGAINST && (
                <Badge variant="negative" rounded="full" textStyle="xs">
                  {t("Voted against")}
                </Badge>
              )}
              {vote?.voteType === VoteType.ABSTAIN && (
                <Badge variant="neutral" rounded="full" textStyle="xs">
                  {t("Abstained")}
                </Badge>
              )}
            </HStack>

            <VStack gap={1} align="start">
              <Heading size={{ base: "md", md: "lg" }} fontWeight="semibold">
                {proposal?.title ?? t("Proposal")}
              </Heading>
              {proposal?.description && (
                <Text textStyle="sm" color="text.subtle" lineClamp={3}>
                  {proposal.description}
                </Text>
              )}
            </VStack>

            {vote?.reason && (
              <VStack gap={1} align="start" p={3} borderRadius="lg" bg="bg.subtle">
                <Text textStyle="xs" fontWeight="semibold" color="text.subtle">
                  {t("Comment")}
                </Text>
                <Text textStyle="sm" whiteSpace="pre-wrap">
                  {vote.reason}
                </Text>
              </VStack>
            )}

            {!vote && (
              <Text textStyle="sm" color="text.subtle">
                {t("This navigator did not vote on this proposal.")}
              </Text>
            )}

            <Button asChild variant="outline" size="sm" alignSelf="end">
              <NextLink href={`/proposals/${proposalId}`}>
                {t("View proposal")}
                <FiArrowUpRight size={16} />
              </NextLink>
            </Button>
          </>
        )}
      </VStack>
    </BaseModal>
  )
}
