import { Box, Card, Separator, HStack, Heading, Skeleton, Spacer, Stack, Text, VStack } from "@chakra-ui/react"
import { humanAddress } from "@repo/utils/FormattingUtils"
import { AddressIcon } from "@/components/AddressIcon"
import { ProposalOverviewVotes } from "./components/ProposalOverviewVotes"
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

export const ProposalOverview = () => {
  const { t } = useTranslation()
  const { account } = useWallet()

  const { proposal } = useProposalDetail()
  const { data: vnsData } = useVechainDomain(proposal.proposer)
  const proposerName = vnsData?.domain

  return (
    <Card.Root variant="baseWithBorder" w="full" borderRadius={"3xl"}>
      <Card.Body>
        <Stack direction={["column", "row"]} justify="space-between" gap={12} w="full" alignItems={"stretch"}>
          <VStack gap={4} align="flex-start" flex={2} justify={"space-between"} minW={0}>
            <VStack gap={2} align="flex-start">
              <HStack justify={"space-between"} align={"center"} w="full">
                <Skeleton loading={proposal.isRoundIdVoteStartLoading}>
                  <Text color="#6A6A6A" fontSize="md" textTransform={"uppercase"} fontWeight={600}>
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
                <ProposalStatusBadge proposalId={proposal.id} proposalState={proposal.state} />
              </Skeleton>
              <Spacer h={"24px"} />
              <Skeleton loading={proposal.isDescriptionLoading}>
                <Text
                  color="gray.500"
                  textStyle={["sm", "md"]}
                  wordBreak="break-word"
                  overflowWrap="break-word"
                  whiteSpace="pre-wrap"
                  maxW="100%">
                  {proposal.description}
                </Text>
              </Skeleton>
            </VStack>
            <Separator color={"#D5D5D5"} w="100%" />
            <Stack
              direction={["column", "column", "row"]}
              w="full"
              justify={["flex-start", "flex-start", "space-between"]}
              gap={8}>
              <Stack
                direction={["column", "column", "row"]}
                gap={[4, 4, 12]}
                align={["flex-start", "flex-start", "center"]}>
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
          </VStack>
          <VStack flex={1} h="full">
            <ProposalOverviewVotes proposalId={proposal.id} />
          </VStack>
        </Stack>
      </Card.Body>
    </Card.Root>
  )
}
