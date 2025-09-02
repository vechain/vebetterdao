import { Card, HStack, Heading, Skeleton, Text, VStack, Tabs } from "@chakra-ui/react"
import { humanAddress } from "@repo/utils/FormattingUtils"
import { AddressIcon } from "@/components/AddressIcon"
import { useTranslation } from "react-i18next"
import { compareAddresses } from "@repo/utils/AddressUtils"
import { useWallet, useVechainDomain } from "@vechain/vechain-kit"
import { ProposalStatusBadge } from "@/components"
import { MilestonesActions } from "../"
import { ProposalEnriched, GrantProposalEnriched } from "@/hooks/proposals/grants/types"

const GrantDetailsTab = () => {
  return (
    <VStack align="stretch" gap={4} p={4}>
      <Text fontSize="lg" fontWeight="600">
        {"WIP"}
      </Text>
      <MilestonesActions />
    </VStack>
  )
}

type ProposalOverviewProps = {
  overviewContent?: React.ReactNode
  isGrant?: boolean
  proposal: ProposalEnriched | GrantProposalEnriched
  isLoading: boolean
}

export const ProposalOverview = ({ overviewContent, isGrant, proposal, isLoading }: ProposalOverviewProps) => {
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

  // Overview Tab Content (just the overview content)
  const OverviewTabContent = () => (
    <VStack gap={4} align="flex-start" w="full">
      {overviewContent}
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
                <OverviewTabContent />
              </Tabs.Content>
              <Tabs.Content value="milestones" pt={6}>
                <GrantDetailsTab />
              </Tabs.Content>
            </Tabs.Root>
          ) : (
            <OverviewTabContent />
          )}
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}
