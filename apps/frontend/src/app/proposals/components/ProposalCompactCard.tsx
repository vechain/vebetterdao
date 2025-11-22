import { Text, Card, VStack, HStack, Skeleton, IconButton, LinkBox, LinkOverlay } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import dayjs from "dayjs"
import NextLink from "next/link"
import React, { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { FaAngleRight } from "react-icons/fa6"

import { GrantDetail } from "@/app/grants/types"
import { ProposalDetail } from "@/app/proposals/types"

import { ProposalState } from "../../../hooks/proposals/grants/types"

import { ProposalStatusBadge } from "./ProposalStatusBadge"
import { ProposalYourVote } from "./ProposalYourVote"

type Props = {
  proposal: ProposalDetail | GrantDetail
  proposalState?: ProposalState
}
export const ProposalCompactCard: React.FC<Props> = ({ proposal, proposalState }) => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const proposalId = proposal.proposalId.toString()
  const { supportEndDate } = proposal.interactionDates

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
                  <ProposalStatusBadge proposalState={proposalState} isDepositReached={proposal.depositReached} />
                  <VStack w="full" gap="1" align={"flex-start"}>
                    <VStack alignItems="flex-start">
                      <Text textStyle={"sm"} fontWeight="semibold">
                        {proposal.metadata.title ?? "-"}
                      </Text>
                      {proposalExtraInfo}
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
