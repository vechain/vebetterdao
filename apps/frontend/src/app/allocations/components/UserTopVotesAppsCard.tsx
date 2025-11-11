"use client"

import { Card, Icon, Flex, Heading, Text, Circle, Skeleton, Box, Float } from "@chakra-ui/react"
import { getConfig } from "@repo/config"
import { FormattingUtils } from "@repo/utils"
import { XAllocationVoting__factory } from "@vechain/vebetterdao-contracts/factories/XAllocationVoting__factory"
import { useWallet } from "@vechain/vechain-kit"
import { useMemo } from "react"
import { formatEther } from "viem"

import { AppImage } from "@/components/AppImage/AppImage"
import Vote from "@/components/Icons/svg/vote.svg"
import { EmptyState } from "@/components/ui/empty-state"
import { useEvents } from "@/hooks/useEvents"

import { AppWithVotes } from "../page"

const isEmpty = false

const abi = XAllocationVoting__factory.abi
const contractAddress = getConfig().xAllocationVotingContractAddress

export const UserTopVotesAppsCard = ({ apps }: { apps: AppWithVotes[] }) => {
  const { account } = useWallet()
  const { data: appsVotedInRounds, isLoading } = useEvents({
    abi,
    contractAddress,
    eventName: "AllocationVoteCast",
    filterParams: { voter: account?.address },
    mapResponse: ({ decodedData }) =>
      decodedData.args.appsIds.map((id, idx) => [id, decodedData.args.voteWeights[idx]]) as Array<[string, bigint]>,
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

  if (isEmpty) {
    return (
      <EmptyState
        icon={
          <Circle aspectRatio={1} width="120px" bg="bg.subtle">
            <Icon as={Vote} boxSize="100px" />
          </Circle>
        }
        title={""}
        description="You haven’t voted for any app yet, start collecting your favourite once."
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
            <Flex key={app!.id} gap="4" alignItems="flex-start">
              <Box position="relative">
                <AppImage appId={app!.id} flexShrink={0} shape="square" borderRadius="lg" />
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

              <Heading flex="1" size="md" lineClamp={1}>
                {app?.name}
              </Heading>

              <Flex flexDir="column" alignItems="flex-end">
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
