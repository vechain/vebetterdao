import { useProposalUserDeposit, useUserSingleProposalVoteEvent } from "@/api"
import { AddressIcon } from "@/components/AddressIcon"
import { GrantsProposalStatusBadge } from "@/components/Proposal/Grants"
import { GrantProposalEnriched, ProposalEnriched } from "@/hooks/proposals/grants/types"
import { Card, Heading, HStack, Tabs, Text, VStack } from "@chakra-ui/react"
import { compareAddresses } from "@repo/utils/AddressUtils"
import { humanAddress } from "@repo/utils/FormattingUtils"
import { useVechainDomain, useWallet } from "@vechain/vechain-kit"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { MilestonesActions } from "../../../grants/components"
import { ProposalContentAndActions } from "../ProposalContentAndActions"

type ProposalOverviewProps = {
  isGrant?: boolean
  proposal?: ProposalEnriched | GrantProposalEnriched
}

export const ProposalOverview = ({ isGrant, proposal }: ProposalOverviewProps) => {
  // ==========================================
  // HOOKS
  // ==========================================
  const { t } = useTranslation()
  const { account } = useWallet()
  const { data: userDeposits } = useProposalUserDeposit(proposal?.id ?? "", account?.address ?? "")
  const { data: userVoteEvent } = useUserSingleProposalVoteEvent(proposal?.id ?? "")
  const { data: vnsData } = useVechainDomain(proposal?.proposerAddress ?? "")

  // ==========================================
  // COMPUTED VALUES & CONSTANTS
  // ==========================================
  const proposerAddress = proposal?.proposerAddress ?? ""
  const proposerName = vnsData?.domain
  const hasUserVoted = !!userVoteEvent?.hasVoted
  const connectedUserIsProposer = compareAddresses(proposerAddress, account?.address ?? "")

  const hasUserDeposited = useMemo(() => {
    return BigInt(userDeposits ?? 0) > BigInt(0)
  }, [userDeposits])

  // ==========================================
  // COMPONENTS
  // ==========================================
  const HeaderContent = () => (
    <VStack gap={5} align="flex-start" w="full">
      {/* Status badge and proposer info */}
      <HStack justify={"space-between"} align={"flex-start"} w="full">
        <GrantsProposalStatusBadge
          state={proposal?.state}
          hasUserSupported={hasUserDeposited}
          hasUserVoted={hasUserVoted}
        />

        <HStack>
          <AddressIcon address={proposerAddress} rounded="full" h="20px" w="20px" />
          <Text>{connectedUserIsProposer ? t("You") : proposerName || humanAddress(proposerAddress, 4, 6)}</Text>
        </HStack>
      </HStack>

      {/* Proposal title */}
      <Heading size={["2xl", "4xl"]}>{proposal?.title}</Heading>
    </VStack>
  )

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <Card.Root variant="baseWithBorder" w="full" borderRadius={"3xl"}>
      <Card.Body>
        <VStack gap={4} align="flex-start" w="full">
          {/* Header section with status badge, proposer info, and title */}
          <HeaderContent />

          {/* Content section: Tabbed interface for grants, direct content for regular proposals */}
          {isGrant ? (
            /* Grant proposals: Overview and Milestones tabs */
            <Tabs.Root defaultValue="overview" w="full" colorPalette="blue" fitted>
              <Tabs.List>
                <Tabs.Trigger
                  value="overview"
                  color="text"
                  fontWeight="400"
                  _selected={{
                    color: "#004CFC",
                    fontWeight: "800",
                  }}>
                  {"Overview"}
                </Tabs.Trigger>
                <Tabs.Trigger
                  value="milestones"
                  color="text.subtle"
                  fontWeight="600"
                  _selected={{
                    color: "#004CFC",
                    fontWeight: "800",
                  }}>
                  {"Milestones"}
                </Tabs.Trigger>
              </Tabs.List>
              <Tabs.Content value="overview" pt={6}>
                <ProposalContentAndActions proposal={proposal} />
              </Tabs.Content>
              <Tabs.Content value="milestones" pt={6}>
                <MilestonesActions proposal={proposal as GrantProposalEnriched} />
              </Tabs.Content>
            </Tabs.Root>
          ) : (
            /* Regular proposals: Direct content display */
            <ProposalContentAndActions proposal={proposal} />
          )}
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}
