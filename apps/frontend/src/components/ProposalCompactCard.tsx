import { useIsDepositReached } from "@/api"
import { useProposalInteractionDates } from "@/api/contracts/governance/hooks/useProposalInteractionDates"
import { ProposalEnriched, ProposalState } from "@/hooks/proposals/grants/types"
import { Card, HStack, IconButton, Skeleton, Text, VStack } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import dayjs from "dayjs"
import { useRouter } from "next/navigation"
import React, { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { FaAngleRight } from "react-icons/fa6"

import { ProposalStatusBadge } from "./Proposal/ProposalStatusBadge"
import { ProposalYourVote } from "./Proposal/ProposalYourVote"

type Props = {
  proposal: ProposalEnriched
  proposalState?: ProposalState
}

export const ProposalCompactCard: React.FC<Props> = ({ proposal, proposalState }) => {
  const { account } = useWallet()
  const { id } = proposal
  const { data: isDepositReached } = useIsDepositReached(id)
  const router = useRouter()

  const { supportEndDate } = useProposalInteractionDates(id)

  const { t } = useTranslation()

  const goToProposal = useCallback(() => {
    router.push(`/proposals/${id}`)
  }, [router, id])

  const proposalExtraInfo = useMemo(() => {
    if (proposal.state === ProposalState.Pending) {
      return (
        <Skeleton loading={!supportEndDate}>
          <Text fontSize={"14px"} color={"gray.500"} fontWeight={400}>
            {t("Starting {{date}}", { date: dayjs(supportEndDate).format("MMM D, YYYY") })}
          </Text>
        </Skeleton>
      )
    }
    if (proposal.state === ProposalState.DepositNotMet) {
      return (
        <Text fontSize={"14px"} color={"gray.500"} fontWeight={400}>
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
          proposalId={id}
          proposalState={proposal.state}
          renderTitle={false}
          textProps={{ color: "gray.500", fontSize: "14px" }}
        />
      )
    }
    return ""
  }, [supportEndDate, proposal.state, t, id, account?.address])

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
              isDepositReached={isDepositReached ?? false}
              containerProps={{
                py: 1,
                px: 2,
              }}
              proposalType={proposal.type}
            />
            <VStack w="full" gap={1} align={"flex-start"}>
              <Text fontSize={"14px"} fontWeight={600}>
                {proposal?.title}
              </Text>
              {proposalExtraInfo}
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
