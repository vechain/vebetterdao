import { Card, HStack, Heading, Skeleton, Text, VStack, Tabs } from "@chakra-ui/react"
import { humanAddress } from "@repo/utils/FormattingUtils"
import { AddressIcon } from "@/components/AddressIcon"
import { useTranslation } from "react-i18next"
import { compareAddresses } from "@repo/utils/AddressUtils"
import { useWallet, useVechainDomain } from "@vechain/vechain-kit"
import { ProposalStatusBadge } from "@/components"
import { MilestonesActions } from "../../../grants/components"
import { ProposalContentAndActions } from "../ProposalContentAndActions"
import { GrantProposalEnriched, ProposalEnriched } from "@/hooks/proposals/grants/types"

type ProposalOverviewProps = {
  isGrant?: boolean
  proposal: ProposalEnriched | GrantProposalEnriched
  isLoading: boolean
}

export const ProposalOverview = ({ isGrant, proposal, isLoading }: ProposalOverviewProps) => {
  const { t } = useTranslation()
  const { account } = useWallet()

  const { data: vnsData } = useVechainDomain(proposal?.proposerAddress)
  const proposerName = vnsData?.domain

  // Header Content (badge, proposer, title)
  const HeaderContent = () => (
    <VStack gap={5} align="flex-start" w="full">
      <HStack justify={"space-between"} align={"flex-start"} w="full">
        <Skeleton loading={isLoading}>
          <ProposalStatusBadge
            proposalState={proposal?.state}
            isDepositReached={false} // TODO: Handle deposit reached from separate hook
            proposalType={proposal?.type}
          />
        </Skeleton>
        <Skeleton loading={isLoading}>
          {proposal && (
            <HStack>
              <AddressIcon address={proposal.proposerAddress} rounded="full" h="20px" w="20px" />
              {compareAddresses(proposal.proposerAddress, account?.address || "") ? (
                <Text>{t("You")}</Text>
              ) : (
                <Text>{proposerName || humanAddress(proposal.proposerAddress, 4, 6)}</Text>
              )}
            </HStack>
          )}
        </Skeleton>
      </HStack>

      <Skeleton loading={isLoading}>
        <Heading size={["2xl", "4xl"]}>{proposal?.title}</Heading>
      </Skeleton>
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
                <MilestonesActions proposalId={proposal.id} />
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
