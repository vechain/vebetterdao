"use client"

import { Card, Icon, Flex, Heading, Text, Circle, Skeleton, Box, Float, Badge } from "@chakra-ui/react"
import { getConfig } from "@repo/config"
import { FormattingUtils } from "@repo/utils"
import { XAllocationVoting__factory } from "@vechain/vebetterdao-contracts/factories/x-allocation-voting-governance/XAllocationVoting__factory"
import { useWallet } from "@vechain/vechain-kit"
import { useMemo } from "react"
import { formatEther } from "viem"

import { AppImage } from "@/components/AppImage/AppImage"
import Vote from "@/components/Icons/svg/vote.svg"
import { EmptyState } from "@/components/ui/empty-state"
import { useEvents } from "@/hooks/useEvents"
import { APP_CATEGORIES } from "@/types/appDetails"

import { AppWithVotes } from "../lib/data"

const abi = XAllocationVoting__factory.abi
const contractAddress = getConfig().xAllocationVotingContractAddress

export const UserTopVotedAppsCard = ({ apps }: { apps: AppWithVotes[] }) => {
  const { account } = useWallet()
  const { data: appsVotedInRounds, isLoading } = useEvents({
    abi,
    contractAddress,
    eventName: "AllocationVoteCast",
    filterParams: { voter: (account?.address ?? "") as `0x${string}` },
    select: events =>
      events.map(
        ({ decodedData }) =>
          decodedData.args.appsIds.map((id, idx) => [id, decodedData.args.voteWeights[idx]]) as Array<[string, bigint]>,
      ),
    enabled: !!account?.address,
  })

  const appVoteMetrics = useMemo(() => {
    const totalWeight = new Map<string, bigint>()
    const timesVoted = new Map<string, number>()

    if (appsVotedInRounds?.length) {
      appsVotedInRounds.forEach(roundAppIds => {
        roundAppIds.forEach(([appId, voteWeight]) => {
          totalWeight.set(appId, (totalWeight.get(appId) ?? 0n) + (voteWeight || 0n))
          timesVoted.set(appId, (timesVoted.get(appId) ?? 0) + 1)
        })
      })
    }

    return { totalWeight, timesVoted }
  }, [appsVotedInRounds])

  const top5VotedAppIds = useMemo(() => {
    if (appVoteMetrics.totalWeight.size === 0) return []

    return Array.from(appVoteMetrics.totalWeight.entries())
      .sort(([, weightA], [, weightB]) => (weightB > weightA ? 1 : weightB < weightA ? -1 : 0))
      .slice(0, 5)
      .map(([appId]) => appId)
  }, [appVoteMetrics])

  const top5VotedApps = useMemo(() => {
    return top5VotedAppIds.map(id => apps.find(app => app.id === id)).filter(Boolean)
  }, [apps, top5VotedAppIds])

  const isEmpty = Array.from(appVoteMetrics.totalWeight.entries()).length === 0

  if (isEmpty) {
    return (
      <EmptyState
        icon={
          <Circle aspectRatio={1} width="120px" bg="bg.subtle">
            <Icon as={Vote} boxSize="100px" />
          </Circle>
        }
        title={""}
        description="You haven’t voted for any app yet, start collecting your favourite ones."
      />
    )
  }

  return (
    <Skeleton loading={isLoading}>
      <Card.Root variant="primary" p="8">
        <Card.Body gap="8">
          <Text textStyle="sm" color="text.subtle">
            {"Most voted app of all time"}
          </Text>
          {top5VotedApps.map((app, idx) => (
            <Flex key={app!.id} gap="4" alignItems="center">
              <Box position="relative">
                <AppImage
                  appId={app!.id}
                  appLogo={app?.metadata?.logo}
                  flexShrink={0}
                  shape="square"
                  borderRadius="lg"
                />
                <Float placement="top-start">
                  <Circle
                    size="5"
                    bg="status.positive.primary"
                    border="sm"
                    borderColor="status.positive.subtle"
                    color="text.alt"
                    textStyle="xs">
                    {idx + 1}
                  </Circle>
                </Float>
              </Box>

              <Flex flex="1" flexDir="column" alignItems="flex-start" gap="1">
                <Heading size="md" lineClamp={1}>
                  {app?.name}
                </Heading>
                {app?.metadata?.categories?.[0] && (
                  <Badge variant="neutral" size="sm" rounded="sm">
                    {APP_CATEGORIES.find(category => category.id === app?.metadata?.categories[0])?.name}
                  </Badge>
                )}
              </Flex>

              <Flex flexDir="column" alignSelf="center" alignItems="flex-end" gap="0.5">
                <Text textStyle="sm" fontWeight="semibold" color="text.muted" flexShrink={0}>
                  {FormattingUtils.humanNumber(formatEther(appVoteMetrics.totalWeight.get(app!.id) ?? 0n))}
                </Text>

                <Text textStyle="sm" color="text.subtle">
                  {appVoteMetrics.timesVoted.get(app!.id)} {"rounds"}
                </Text>
              </Flex>
            </Flex>
          ))}
        </Card.Body>
      </Card.Root>
    </Skeleton>
  )
}
