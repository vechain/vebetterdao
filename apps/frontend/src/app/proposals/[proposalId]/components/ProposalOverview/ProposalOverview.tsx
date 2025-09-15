import { AddressIcon } from "@/components/AddressIcon"
import { GrantProposalEnriched, ProposalEnriched } from "@/hooks/proposals/grants/types"
import { Card, Heading, HStack, Tabs, Text, VStack } from "@chakra-ui/react"
import { compareAddresses } from "@repo/utils/AddressUtils"
import { humanAddress } from "@repo/utils/FormattingUtils"
import { useVechainDomain, useWallet } from "@vechain/vechain-kit"
import { useTranslation } from "react-i18next"

import { MilestonesActions } from "../../../grants/components"
import { ProposalContentAndActions } from "../ProposalContentAndActions"
import { ProposalStatusBadge } from "@/components/Proposal/ProposalStatusBadge"
import { useIsDepositReached } from "@/api"

type ProposalOverviewProps = {
  isGrant?: boolean
  proposal?: ProposalEnriched | GrantProposalEnriched
}

export const ProposalOverview = ({ isGrant, proposal }: ProposalOverviewProps) => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const proposalId = proposal?.id ?? ""
  const proposerAddress = proposal?.proposerAddress ?? ""

  const { data: vnsData } = useVechainDomain(proposerAddress)
  const { data: isDepositReached } = useIsDepositReached(proposalId)

  const proposerName = vnsData?.domain

  // Header Content (badge, proposer, title)
  const HeaderContent = () => (
    <VStack gap={5} align="flex-start" w="full">
      <HStack justify={"space-between"} align={"flex-start"} w="full">
        <ProposalStatusBadge
          proposalState={proposal?.state}
          isDepositReached={isDepositReached ?? false}
          proposalType={proposal?.type}
        />
        {proposal && (
          <HStack>
            <AddressIcon address={proposerAddress} rounded="full" h="20px" w="20px" />
            {compareAddresses(proposerAddress, account?.address || "") ? (
              <Text>{t("You")}</Text>
            ) : (
              <Text>{proposerName || humanAddress(proposerAddress, 4, 6)}</Text>
            )}
          </HStack>
        )}
      </HStack>

      <Heading size={["2xl", "4xl"]}>{proposal?.title}</Heading>
    </VStack>
  )

  return (
    <Card.Root variant="baseWithBorder" w="full" borderRadius={"3xl"}>
      <Card.Body>
        <VStack gap={4} align="flex-start" w="full">
          <HeaderContent />

          {/* Tabs if it is a grant proposal */}
          {isGrant ? (
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
            <ProposalContentAndActions proposal={proposal} />
          )}
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}
