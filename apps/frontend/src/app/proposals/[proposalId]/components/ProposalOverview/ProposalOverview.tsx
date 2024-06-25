import {
  Card,
  CardBody,
  Divider,
  Flex,
  HStack,
  Heading,
  Show,
  Skeleton,
  SkeletonText,
  Spacer,
  Text,
  VStack,
} from "@chakra-ui/react"
import { humanAddress } from "@repo/utils/FormattingUtils"
import { AddressIcon } from "@/components/AddressIcon"
import { ProposalOverviewVotes } from "./components/ProposalOverviewVotes"
import { ProposalOverviewTime } from "./components/ProposalOverviewTime"
import { ProposalOverviewStatusLabel } from "./components/ProposalOverviewStatusLabel"
import { ProposalOverviewYourSupport } from "./components/ProposalOverviewYourSupport"
import { ProposalOverviewCommunitySupport } from "./components/ProposalOverviewCommunitySupport"
import { ProposalYourVote } from "./components/ProposalYourVote"
import { useTranslation } from "react-i18next"
import { CastProposalVoteButton } from "./components/CastProposalVoteButton"
import { compareAddresses } from "@repo/utils/AddressUtils"
import { useWallet } from "@vechain/dapp-kit-react"
import { useProposalDetail } from "../../hooks"
import { ProposalShareButton } from "./components/ProposalShareButton"

export const ProposalOverview = () => {
  const { proposal } = useProposalDetail()
  const { t } = useTranslation()
  const { account } = useWallet()

  return (
    <Card variant="baseWithBorder">
      <CardBody>
        <Flex gap="48px" flexDir={["column", "column", "row"]}>
          <VStack gap={"20px"} alignItems={"stretch"} flex={3} justify={"space-between"}>
            <VStack alignItems={"stretch"}>
              <HStack justify={"space-between"}>
                <HStack gap={1}>
                  <Text fontWeight={"600"} color="#6A6A6A">
                    {t("ROUND")}
                  </Text>
                  <Skeleton isLoaded={!proposal.isRoundIdVoteStartLoading} display={"inline-flex"} ml={1}>
                    <Text fontWeight={"600"} color="#6A6A6A">
                      {t(`#{{round}}`, { round: proposal.roundIdVoteStart })}
                    </Text>
                  </Skeleton>
                </HStack>
                <Show below="md">
                  <ProposalShareButton />
                </Show>
              </HStack>
              <Skeleton isLoaded={!proposal.isTitleLoading}>
                <Heading fontWeight={700} fontSize="36px" color="#252525">
                  {proposal.title}
                </Heading>
              </Skeleton>
              <Skeleton isLoaded={!proposal.isStateLoading} alignSelf={"flex-start"}>
                <ProposalOverviewStatusLabel />
              </Skeleton>
              <Spacer h={"24px"} />
              <SkeletonText isLoaded={!proposal.isDescriptionLoading}>
                <Text color="#252525">{proposal.description}</Text>
              </SkeletonText>
            </VStack>
            <VStack alignItems={"stretch"}>
              <Divider color="#D5D5D5" />
              <HStack justify={"space-between"} flexWrap={"wrap"}>
                <HStack justify={{ base: "space-between", md: "flex-start" }} flexWrap={"wrap"} gap={8}>
                  <VStack alignItems={"stretch"}>
                    <Text fontWeight={"400"} color="#6A6A6A">
                      {t("Created by")}
                    </Text>
                    <Skeleton isLoaded={!proposal.isProposerLoading}>
                      <HStack>
                        <AddressIcon address={proposal.proposer} rounded="full" h="20px" w="20px" />
                        {compareAddresses(proposal.proposer, account || "") ? (
                          <Text color="#252525">{t("You")}</Text>
                        ) : (
                          <Text color="#252525">{humanAddress(proposal.proposer, 4, 6)}</Text>
                        )}
                      </HStack>
                    </Skeleton>
                  </VStack>
                  <ProposalYourVote />
                  <ProposalOverviewTime />
                  <ProposalOverviewCommunitySupport />
                  <ProposalOverviewYourSupport />
                </HStack>
                <HStack justify={"flex-end"} flexWrap={"wrap"} gap={4}>
                  <Show above="md">
                    <ProposalShareButton />
                  </Show>
                  <CastProposalVoteButton />
                </HStack>
              </HStack>
            </VStack>
          </VStack>
          <Skeleton isLoaded={!proposal.isVotesLoading && !proposal.isStateLoading} rounded="8px" flex={1.5}>
            <ProposalOverviewVotes />
          </Skeleton>
        </Flex>
      </CardBody>
    </Card>
  )
}
