import {
  Box,
  Card,
  CardBody,
  Divider,
  HStack,
  Heading,
  Skeleton,
  SkeletonText,
  Spacer,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react"
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
    <Card variant="baseWithBorder" w="full" borderRadius={"3xl"}>
      <CardBody>
        <Stack direction={["column", "row"]} justify="space-between" spacing={12} w="full" alignItems={"stretch"}>
          <VStack spacing={4} align="flex-start" flex={2} justify={"space-between"}>
            <VStack spacing={2} align="flex-start">
              <HStack justify={"space-between"} align={"center"} w="full">
                <Skeleton isLoaded={!proposal.isRoundIdVoteStartLoading}>
                  <Text color="#6A6A6A" fontSize={["md"]} textTransform={"uppercase"} fontWeight={600}>
                    {t("Round #{{round}}", {
                      round: proposal.roundIdVoteStart,
                    })}
                  </Text>
                </Skeleton>
                <ProposalShareButton />
              </HStack>

              <Skeleton isLoaded={!proposal.isTitleLoading}>
                <Heading size={["lg", "xl"]}>{proposal.title}</Heading>
              </Skeleton>
              <Skeleton isLoaded={!proposal.isStateLoading} alignSelf={"flex-start"}>
                <ProposalStatusBadge state={proposal.state} />
              </Skeleton>
              <Spacer h={"24px"} />
              <SkeletonText isLoaded={!proposal.isDescriptionLoading}>
                <Text color="gray.500" fontSize={["sm", "md"]}>
                  {proposal.description}
                </Text>
              </SkeletonText>
            </VStack>

            <Divider color={"#D5D5D5"} />
            <Stack
              direction={["column", "column", "row"]}
              w="full"
              justify={["flex-start", "flex-start", "space-between"]}
              spacing={8}>
              <Stack
                direction={["column", "column", "row"]}
                spacing={[4, 4, 12]}
                align={["flex-start", "flex-start", "center"]}>
                <Box>
                  <Text fontWeight={"400"} color="#6A6A6A">
                    {t("Created by")}
                  </Text>
                  <Skeleton isLoaded={!proposal.isProposerLoading}>
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
      </CardBody>
    </Card>
  )
}
