"use client"

import {
  Box,
  Circle,
  Card,
  HStack,
  Icon,
  Heading,
  Grid,
  VStack,
  Badge,
  Float,
  Text,
  Button,
  Collapsible,
  Skeleton,
  Separator,
} from "@chakra-ui/react"
import { getConfig } from "@repo/config"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { VoterRewards__factory } from "@vechain/vebetterdao-contracts/factories/VoterRewards__factory"
import { XAllocationVoting__factory } from "@vechain/vebetterdao-contracts/factories/XAllocationVoting__factory"
import { useWallet } from "@vechain/vechain-kit"
import { Activity, Check } from "iconoir-react"
import { useState, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { formatEther } from "viem"

import { AppImage } from "@/components/AppImage/AppImage"
import Vote from "@/components/Icons/svg/vote.svg"
import { EmptyState } from "@/components/ui/empty-state"
import { useEvents } from "@/hooks/useEvents"
import { APP_CATEGORIES } from "@/types/appDetails"

import { AllocationRoundDetails, AppWithVotes } from "../lib/data"

const INITIAL_DISPLAY_COUNT = 3

const abi = XAllocationVoting__factory.abi
const contractAddress = getConfig().xAllocationVotingContractAddress

const voterRewardsAbi = VoterRewards__factory.abi
const voterRewardsAddress = getConfig().voterRewardsContractAddress as `0x${string}`

interface AppVoteItemProps {
  app: AppWithVotes | undefined
  voteWeight: bigint
}

const AppVoteItem = ({ app, voteWeight }: AppVoteItemProps) => (
  <Card.Root key={app?.id} p="4" bg="card.subtle" asChild>
    <Grid gridTemplateColumns="50px 1fr auto" alignItems="center">
      <Box position="relative">
        <AppImage boxSize="11" appId={app?.id || ""} flexShrink={0} shape="square" borderRadius="lg" />
        <Float placement="top-end" offsetX="3" offsetY="1">
          <Circle
            size="4"
            bg="status.positive.primary"
            border="sm"
            borderColor="status.positive.subtle"
            color="text.alt">
            <Icon as={Check} boxSize="3" color="text.alt" />
          </Circle>
        </Float>
      </Box>

      <VStack gap="1" align="start">
        <Heading size={{ base: "sm", md: "md" }} color="text.default" fontWeight="semibold" lineClamp={1}>
          {app?.name || "-"}
        </Heading>
        <Badge variant="neutral" size="sm" rounded="sm">
          {APP_CATEGORIES.find(category => category.id === app?.metadata?.categories[0])?.name || "-"}
        </Badge>
      </VStack>

      <Text textStyle="md" fontWeight="semibold">
        {getCompactFormatter(2).format(Number(formatEther(voteWeight)))}
      </Text>
    </Grid>
  </Card.Root>
)

export const UserVotingActivityCard = ({ roundDetails }: { roundDetails: AllocationRoundDetails }) => {
  const { t } = useTranslation()
  const { id: roundId, apps } = roundDetails
  const [isOpen, setIsOpen] = useState(false)
  const { account } = useWallet()
  const { data: voteCastEvents, isLoading } = useEvents({
    abi,
    contractAddress,
    eventName: "AllocationVoteCast",
    filterParams: { voter: account?.address, roundId: BigInt(roundId) },
    mapResponse: ({ decodedData }) =>
      decodedData.args.appsIds.map((id, idx) => [
        decodedData.args.roundId,
        id,
        decodedData.args.voteWeights[idx],
      ]) as Array<[bigint, string, bigint]>,
  })

  const { data: rewardClaimed, isLoading: isRewardClaimedLoading } = useEvents({
    abi: voterRewardsAbi,
    contractAddress: voterRewardsAddress,
    eventName: "RewardClaimedV2",
    filterParams: {
      cycle: BigInt(roundId),
      voter: account?.address,
    },
    mapResponse: ({ decodedData }) =>
      getCompactFormatter(2).format(Number(formatEther(decodedData.args.reward + decodedData.args.gmReward))),
  })

  const [appsVotedInRound] = voteCastEvents || []

  const appVoteMetrics = useMemo(() => {
    const votes = new Map<string, bigint>()

    if (appsVotedInRound?.length) {
      appsVotedInRound.forEach(([_id, appId, vote]) => {
        votes.set(appId, vote)
      })
    }

    return votes
  }, [appsVotedInRound])
  const votingPowerUsed = getCompactFormatter(2).format(
    Number(formatEther([...appVoteMetrics.entries()].reduce((vp, app) => vp + app[1], 0n))),
  )

  const appVoteMetricsSortedByWeight = useMemo(() => {
    if (appVoteMetrics.size === 0) return []

    return Array.from(appVoteMetrics.entries())
      .sort(([, weightA], [, weightB]) => (weightB > weightA ? 1 : weightB < weightA ? -1 : 0))
      .map(([appId]) => appId)
  }, [appVoteMetrics])

  const topVotedApps = useMemo(() => {
    return appVoteMetricsSortedByWeight.map(id => apps.find(app => app.id === id)).filter(Boolean)
  }, [apps, appVoteMetricsSortedByWeight])

  const visibleApps = isOpen ? topVotedApps : topVotedApps.slice(0, INITIAL_DISPLAY_COUNT)
  const hasMoreApps = topVotedApps.length > INITIAL_DISPLAY_COUNT

  return (
    <Card.Root p={{ base: "4", md: "6" }} height="max-content" minHeight={{ base: "fit-content", md: "500px" }}>
      <Card.Header as={HStack} gap="2" pb={{ base: "5", md: "6" }}>
        <Icon as={Activity} boxSize="5" color="icon.default" />
        <Heading size={{ base: "md", md: "lg" }} fontWeight="semibold">
          {t("Your voting activity")}
        </Heading>
      </Card.Header>
      <Card.Body asChild>
        {!isLoading && appVoteMetrics.size === 0 ? (
          <EmptyState
            flex={1}
            display="flex"
            justifyContent="center"
            icon={
              <Circle aspectRatio={1} width="120px" bg="bg.subtle">
                <Icon as={Vote} boxSize="100px" />
              </Circle>
            }
            title=""
            description="You haven't voted in this round"
          />
        ) : (
          <Grid
            gridTemplateColumns={{ base: "1fr 1px 1fr", md: "repeat(2,1fr)" }}
            rowGap={{ base: "5", md: "8" }}
            columnGap={{ base: "8", md: "3" }}>
            <Card.Root
              p={{ base: 0, md: "4" }}
              bg={{ base: "transparent", md: "card.subtle" }}
              gap="1"
              height="max-content">
              <Text textStyle={{ base: "sm", md: "md" }} color="text.subtle">
                {t("Voting power used")}
              </Text>
              <Text textStyle="xl" fontWeight="semibold">
                {votingPowerUsed}
              </Text>
            </Card.Root>
            <Separator hideFrom="md" orientation="vertical" borderColor="border.secondary" />
            <Card.Root
              p={{ base: 0, md: "4" }}
              bg={{ base: "transparent", md: "card.subtle" }}
              gap="1"
              height="max-content">
              <Text textStyle={{ base: "sm", md: "md" }} color="text.subtle">
                {t("Rewards earned")}
              </Text>

              <Skeleton loading={isRewardClaimedLoading}>
                <Text textStyle="xl" fontWeight="semibold" color="status.positive.primary">
                  {"+"}
                  {getCompactFormatter(2).format(Number(rewardClaimed))}
                  {" B3TR"}
                </Text>
              </Skeleton>
            </Card.Root>
            <VStack gridColumn={{ base: "1 / 4", md: "1 / 3" }} align="stretch" gap="3">
              <HStack justifyContent="space-between">
                <Heading size="sm">{t("Voted for")}</Heading>
                <Badge variant="neutral" size="sm" rounded="sm">
                  {`${appVoteMetricsSortedByWeight.length} ` +
                    (appVoteMetricsSortedByWeight.length > 1 ? t("apps") : t("app"))}
                </Badge>
              </HStack>
              <Collapsible.Root open={isOpen} onOpenChange={details => setIsOpen(details.open)}>
                <VStack mt={{ base: "0", md: "1.5" }} gap="2" align="stretch">
                  {visibleApps.map(app => (
                    <AppVoteItem key={app?.id} app={app} voteWeight={appVoteMetrics.get(app?.id || "") || 0n} />
                  ))}

                  {hasMoreApps && (
                    <>
                      <Collapsible.Content>
                        <VStack gap="2" align="stretch">
                          {topVotedApps.slice(INITIAL_DISPLAY_COUNT).map(app => (
                            <AppVoteItem key={app?.id} app={app} voteWeight={appVoteMetrics.get(app?.id || "") || 0n} />
                          ))}
                        </VStack>
                      </Collapsible.Content>
                      <Collapsible.Trigger asChild>
                        <Button size={{ base: "sm", md: "md" }} variant="link" fontWeight="semibold">
                          <Collapsible.Context>
                            {api => (api.open ? t("View less") : t("View all"))}
                          </Collapsible.Context>
                        </Button>
                      </Collapsible.Trigger>
                    </>
                  )}
                </VStack>
              </Collapsible.Root>
            </VStack>
          </Grid>
        )}
      </Card.Body>
    </Card.Root>
  )
}
