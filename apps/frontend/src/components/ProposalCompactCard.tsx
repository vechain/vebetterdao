import { Text, Card, VStack, HStack, IconButton, LinkBox, LinkOverlay, Badge } from "@chakra-ui/react"
import NextLink from "next/link"
import React from "react"
import { useTranslation } from "react-i18next"
import { FaAngleRight } from "react-icons/fa6"

import { useUserSingleProposalVoteEvent } from "@/api/contracts/governance/hooks/useUserProposalsVoteEvents"
import { ProposalEnriched, ProposalState, ProposalType } from "@/hooks/proposals/grants/types"

import { ProposalStatusBadge } from "./Proposal/ProposalStatusBadge"

type Props = {
  proposal: ProposalEnriched
  proposalState?: ProposalState
}
export const ProposalCompactCard: React.FC<Props> = ({ proposal, proposalState }) => {
  const { id: proposalId, title: proposalTitle } = proposal
  const { t } = useTranslation()

  const isActive = proposalState === ProposalState.Active
  const { data: voteEvent } = useUserSingleProposalVoteEvent(isActive ? proposalId : undefined)
  const hasVoted = !!voteEvent?.hasVoted

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
                  <VStack w="full" gap="1" align={"flex-start"}>
                    <VStack alignItems="flex-start" gap="4">
                      <Text textStyle={"sm"} fontWeight="semibold">
                        {proposal.type === ProposalType.Grant ? t("Grant") : t("Proposal")}
                        {": "}
                        {proposalTitle}
                      </Text>
                      <HStack gap="2" flexWrap="wrap">
                        <ProposalStatusBadge proposalId={proposalId} proposalState={proposalState} />
                        {isActive &&
                          (hasVoted ? (
                            <Badge size="sm" variant="positive">
                              {t("Voted")}
                            </Badge>
                          ) : (
                            <Badge size="sm" variant="warning">
                              {t("Vote required")}
                            </Badge>
                          ))}
                      </HStack>
                    </VStack>
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
