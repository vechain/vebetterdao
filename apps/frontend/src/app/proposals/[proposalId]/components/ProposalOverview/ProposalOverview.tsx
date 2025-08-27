import { Box, Card, Separator, HStack, Heading, Skeleton, Spacer, Stack, Text, VStack, Tabs } from "@chakra-ui/react"
import { humanAddress } from "@repo/utils/FormattingUtils"
import { AddressIcon } from "@/components/AddressIcon"
import { ProposalOverviewTime } from "./components/ProposalOverviewTime"
import { ProposalOverviewYourSupport } from "./components/ProposalOverviewYourSupport"
import { ProposalOverviewCommunitySupport } from "./components/ProposalOverviewCommunitySupport"
import { useTranslation } from "react-i18next"
import { CastProposalVoteButton } from "./components/CastProposalVoteButton"
import { compareAddresses } from "@repo/utils/AddressUtils"
import { useWallet, useVechainDomain } from "@vechain/vechain-kit"
import { useProposalDetail } from "../../hooks"
import { ProposalShareButton } from "./components/ProposalShareButton"
import { ProposalStatusBadge, ProposalYourVote } from "@/components"
import { MilestonesActions } from "../"

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
  proposalCreatedEvent?: any
  isGrantProposal?: boolean
}

export const ProposalOverview = ({
  overviewContent,
  proposalCreatedEvent: _proposalCreatedEvent,
  isGrantProposal,
}: ProposalOverviewProps) => {
  const { t } = useTranslation()
  const { account } = useWallet()

  const { proposal } = useProposalDetail()
  const { data: vnsData } = useVechainDomain(proposal.proposer)
  const proposerName = vnsData?.domain

  // Header Content (title, status, basic info)
  const HeaderContent = () => (
    <VStack gap={2} align="flex-start" w="full">
      <HStack justify={"space-between"} align={"center"} w="full">
        <Skeleton loading={proposal.isRoundIdVoteStartLoading}>
          <Text color="#6A6A6A" fontSize={["md"]} textTransform={"uppercase"} fontWeight={600}>
            {t("Round #{{round}}", {
              round: proposal.roundIdVoteStart,
            })}
          </Text>
        </Skeleton>
        <ProposalShareButton />
      </HStack>

      <Skeleton loading={proposal.isTitleLoading}>
        <Heading size={["2xl", "4xl"]}>{proposal.title}</Heading>
      </Skeleton>
      <Skeleton loading={proposal.isStateLoading} alignSelf={"flex-start"}>
        <ProposalStatusBadge proposalState={proposal.state} isDepositReached={proposal?.isDepositReached ?? false} />
      </Skeleton>
      <Spacer h={"24px"} />
      <Skeleton loading={proposal.isDescriptionLoading}>
        <Text
          color="gray.500"
          fontSize={["sm", "md"]}
          wordBreak="break-word"
          overflowWrap="break-word"
          whiteSpace="pre-wrap"
          maxW="100%">
          {proposal.description}
        </Text>
      </Skeleton>
    </VStack>
  )

  // Info section with creator info and actions
  // @TODO : Move to the right side bar later
  const InfoProposal = () => (
    <Stack
      direction={["column", "column", "row"]}
      w="full"
      justify={["flex-start", "flex-start", "space-between"]}
      gap={8}>
      <Stack direction={["column", "column", "row"]} gap={[4, 4, 12]} align={["flex-start", "flex-start", "center"]}>
        <Box>
          <Text fontWeight={"400"} color="#6A6A6A">
            {t("Created by")}
          </Text>
          <Skeleton loading={proposal.isProposerLoading}>
            <HStack>
              <AddressIcon address={proposal.proposer} rounded="full" h="20px" w="20px" />
              {compareAddresses(proposal.proposer, account?.address || "") ? (
                <Text>{t("You")}</Text>
              ) : (
                <Text>{proposerName || humanAddress(proposal.proposer, 4, 6)}</Text>
              )}
            </HStack>
          </Skeleton>
        </Box>

        <ProposalOverviewTime />
        <ProposalOverviewCommunitySupport />
        <ProposalOverviewYourSupport />

        <ProposalYourVote proposalId={proposal.id} proposalState={proposal.state} />
      </Stack>

      {account?.address && <CastProposalVoteButton proposalId={proposal.id} />}
    </Stack>
  )

  // Overview Tab Content (just the overview content)
  const OverviewTabContent = () => (
    <VStack gap={4} align="flex-start" w="full">
      {overviewContent && overviewContent}
    </VStack>
  )

  return (
    <Card.Root variant="baseWithBorder" w="full" borderRadius={"3xl"}>
      <Card.Body>
        <VStack gap={4} align="flex-start" w="full">
          <HeaderContent />
          <Separator color={"#D5D5D5"} w="100%" />

          {/* TODO: Remove that in the right side bar later */}
          <InfoProposal />

          {/* Tabs section */}
          {isGrantProposal ? (
            <Tabs.Root defaultValue="overview" w="full">
              <Tabs.List>
                <Tabs.Trigger value="overview">{"Overview"}</Tabs.Trigger>
                <Tabs.Trigger value="grant-details">{"Grant details"}</Tabs.Trigger>
              </Tabs.List>
              <Tabs.Content value="overview" pt={6}>
                <OverviewTabContent />
              </Tabs.Content>
              <Tabs.Content value="grant-details" pt={6}>
                <GrantDetailsTab />
              </Tabs.Content>
            </Tabs.Root>
          ) : (
            <>
              <Separator color={"#D5D5D5"} w="100%" />
              <OverviewTabContent />
            </>
          )}
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}
