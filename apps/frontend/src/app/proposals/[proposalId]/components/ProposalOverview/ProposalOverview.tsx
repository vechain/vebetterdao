import {
  Card,
  Divider,
  Flex,
  HStack,
  Heading,
  IconButton,
  Skeleton,
  SkeletonText,
  Spacer,
  Text,
  VStack,
} from "@chakra-ui/react"
import { humanAddress } from "@repo/utils/FormattingUtils"
import { AddressIcon } from "@/components/AddressIcon"
import { useCurrentProposal } from "@/api"
import { ProposalOverviewVotes } from "./components/ProposalOverviewVotes"
import { UilShareAlt } from "@iconscout/react-unicons"
import { ProposalOverviewTime } from "./components/ProposalOverviewTime"
import { ProposalOverviewStatusLabel } from "./components/ProposalOverviewStatusLabel"
import { ProposalOverviewYourSupport } from "./components/ProposalOverviewYourSupport"
import { ProposalOverviewCommunitySupport } from "./components/ProposalOverviewCommunitySupport"
import { ProposalYourVote } from "./components/ProposalYourVote"
import { useTranslation } from "react-i18next"

export const ProposalOverview = () => {
  const { proposal } = useCurrentProposal()
  const { t } = useTranslation()

  return (
    <Card border="1px solid #D5D5D5" rounded="16px" p="24px">
      <Flex gap="48px" flexDir={["column", "column", "row"]}>
        <VStack gap={"20px"} alignItems={"stretch"} flex={3} justify={"space-between"}>
          <VStack alignItems={"stretch"}>
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
            <Skeleton isLoaded={!proposal.isTitleLoading}>
              <Heading fontWeight={700} fontSize="36px" color="#252525" wordBreak={"break-word"}>
                {proposal.title}
              </Heading>
            </Skeleton>
            <Skeleton isLoaded={!proposal.isStateLoading} alignSelf={"flex-start"}>
              <ProposalOverviewStatusLabel />
            </Skeleton>
            <Spacer h={"24px"} />
            <SkeletonText isLoaded={!proposal.isDescriptionLoading}>
              <Text color="#252525" wordBreak={"break-word"}>
                {proposal.description}
              </Text>
            </SkeletonText>
          </VStack>
          <VStack alignItems={"stretch"}>
            <Divider color="#D5D5D5" />
            <HStack justify={"space-between"} flexWrap={"wrap"}>
              <VStack alignItems={"stretch"}>
                <Text fontWeight={"400"} color="#6A6A6A">
                  {t("Created by")}
                </Text>
                <Skeleton isLoaded={!proposal.isProposerLoading}>
                  <HStack>
                    <AddressIcon address={proposal.proposer} rounded="full" h="20px" w="20px" />
                    <Text color="#252525">{humanAddress(proposal.proposer, 7, 5)}</Text>
                  </HStack>
                </Skeleton>
              </VStack>
              <ProposalYourVote />
              <ProposalOverviewTime />
              <ProposalOverviewCommunitySupport />
              <ProposalOverviewYourSupport />
              <IconButton
                isDisabled={proposal.isStateLoading}
                aria-label="share"
                rounded="full"
                bgColor="#E0E9FE"
                color="#004CFC"
                h="40px"
                w="40px">
                <UilShareAlt size="20px" />
              </IconButton>
            </HStack>
          </VStack>
        </VStack>
        <Skeleton isLoaded={!proposal.isVotesLoading && !proposal.isStateLoading} rounded="8px" flex={1.5}>
          <ProposalOverviewVotes />
        </Skeleton>
      </Flex>
    </Card>
  )
}
