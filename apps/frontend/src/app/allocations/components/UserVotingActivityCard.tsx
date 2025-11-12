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
} from "@chakra-ui/react"
import { getConfig } from "@repo/config"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { XAllocationVoting__factory } from "@vechain/vebetterdao-contracts/factories/XAllocationVoting__factory"
import { useWallet } from "@vechain/vechain-kit"
import { Activity, Check } from "iconoir-react"
import { useState, useMemo } from "react"
import { formatEther } from "viem"

import { AppImage } from "@/components/AppImage/AppImage"
import Vote from "@/components/Icons/svg/vote.svg"
import { EmptyState } from "@/components/ui/empty-state"
import { useEvents } from "@/hooks/useEvents"

import { AppWithVotes } from "../page"

const INITIAL_DISPLAY_COUNT = 3

const abi = XAllocationVoting__factory.abi
const contractAddress = getConfig().xAllocationVotingContractAddress

export const UserVotingActivityCard = ({ roundId, apps }: { roundId: bigint; apps: AppWithVotes[] }) => {
  const [isOpen, setIsOpen] = useState(false)
  const { account } = useWallet()
  const { data: appsVotedInRounds, isLoading } = useEvents({
    abi,
    contractAddress,
    eventName: "AllocationVoteCast",
    filterParams: { voter: account?.address },
    mapResponse: ({ decodedData }) =>
      decodedData.args.appsIds.map((id, idx) => [
        decodedData.args.roundId,
        id,
        decodedData.args.voteWeights[idx],
      ]) as Array<[bigint, string, bigint]>,
  })

  // TODO: update this logic to make it leaner
  const appVoteMetrics = useMemo(() => {
    const totalWeight = new Map<string, bigint>()
    const timesVoted = new Map<string, number>()

    if (appsVotedInRounds?.length) {
      appsVotedInRounds.forEach(roundAppIds => {
        roundAppIds.forEach(([id, appId, voteWeight]) => {
          if (id === roundId) {
            totalWeight.set(appId, (totalWeight.get(appId) ?? 0n) + (voteWeight || 0n))
            timesVoted.set(appId, (timesVoted.get(appId) ?? 0) + 1)
          }
        })
      })
    }

    return { totalWeight, timesVoted }
  }, [appsVotedInRounds, roundId])

  const appVoteMetricsSortedByWeight = useMemo(() => {
    if (appVoteMetrics.totalWeight.size === 0) return []

    return Array.from(appVoteMetrics.totalWeight.entries())
      .sort(([, weightA], [, weightB]) => (weightB > weightA ? 1 : weightB < weightA ? -1 : 0))
      .map(([appId]) => appId)
  }, [appVoteMetrics])

  const topVotedApps = useMemo(() => {
    return appVoteMetricsSortedByWeight.map(id => apps.find(app => app.id === id)).filter(Boolean)
  }, [apps, appVoteMetricsSortedByWeight])

  const votingPowerUsed = useMemo(() => {
    const vp = Array.from(appVoteMetrics.totalWeight.entries()).reduce((vp, [, weight]) => vp + weight, 0n)

    return getCompactFormatter(2).format(Number(formatEther(vp)))
  }, [appVoteMetrics.totalWeight])

  const visibleApps = isOpen ? topVotedApps : topVotedApps.slice(0, INITIAL_DISPLAY_COUNT)
  const hasMoreApps = topVotedApps.length > INITIAL_DISPLAY_COUNT

  const AppVoteItem = ({ app }: { app: AppWithVotes | undefined }) => (
    <Card.Root key={app?.id} p="4" bg="card.subtle" asChild>
      <Grid gridTemplateColumns="50px 1fr auto" placeContent="center">
        <Box position="relative">
          <AppImage appId={app?.id || ""} flexShrink={0} shape="square" borderRadius="lg" />
          <Float placement="top-end">
            <Circle
              size="5"
              bg="status.positive.primary"
              border="sm"
              borderColor="status.positive.subtle"
              color="text.alt"
              textStyle="xs">
              <Icon as={Check} boxSize="18px" color="text.alt" />
            </Circle>
          </Float>
        </Box>

        <HStack gap="2">
          <Text textStyle={{ base: "sm", md: "md" }} color="text.subtle">
            {app?.name || "-"}
          </Text>
        </HStack>

        <Text textStyle="md" fontWeight="semibold">
          {"+XXX.XXM"}
        </Text>
      </Grid>
    </Card.Root>
  )

  return (
    <Card.Root p="6" height="max-content">
      <Card.Header as={HStack} gap="2">
        <Icon as={Activity} boxSize="5" color="icon.default" />
        <Heading size="lg" fontWeight="semibold">
          {"Your voting activity"}
        </Heading>
      </Card.Header>
      <Card.Body asChild>
        {!isLoading && appVoteMetrics.timesVoted.size === 0 ? (
          <EmptyState
            my="auto"
            icon={
              <Circle aspectRatio={1} width="120px" bg="bg.subtle">
                <Icon as={Vote} boxSize="100px" />
              </Circle>
            }
            title=""
            description="You haven't voted in this round"
          />
        ) : (
          <Grid gridTemplateColumns="repeat(2,1fr)" rowGap="3" columnGap="8">
            <Card.Root p="4" bg="card.subtle" gap="1">
              <Text textStyle={{ base: "sm", md: "md" }} color="text.subtle">
                {"Voting power used"}
              </Text>
              <Text textStyle="md" fontWeight="semibold">
                {votingPowerUsed}
              </Text>
            </Card.Root>
            <Card.Root p="4" bg="card.subtle" gap="1" height="max-content">
              <Text textStyle={{ base: "sm", md: "md" }} color="text.subtle">
                {"Rewards earned"}
              </Text>

              <Text textStyle="md" fontWeight="semibold" color="status.positive.primary">
                {"+XXX.XXM B3TR"}
              </Text>
            </Card.Root>
            <VStack gridColumn="1 / 3" align="stretch" gap="3">
              <HStack justifyContent="space-between">
                <Heading size="sm">{"Voted for"}</Heading>
                <Badge variant="neutral" size="sm" rounded="sm">
                  {`${appVoteMetricsSortedByWeight.length} apps`}
                </Badge>
              </HStack>
              <Collapsible.Root open={isOpen} onOpenChange={details => setIsOpen(details.open)}>
                <VStack gap="2" align="stretch">
                  {visibleApps.map(app => (
                    <AppVoteItem key={app?.id} app={app} />
                  ))}

                  {hasMoreApps && (
                    <>
                      <Collapsible.Content>
                        <VStack gap="2" align="stretch">
                          {topVotedApps.slice(INITIAL_DISPLAY_COUNT).map(app => (
                            <AppVoteItem key={app?.id} app={app} />
                          ))}
                        </VStack>
                      </Collapsible.Content>

                      <Collapsible.Trigger asChild mt="2">
                        <Button variant="plain" colorPalette="blue" fontWeight="semibold" textStyle="md">
                          <Collapsible.Context>{api => (api.open ? "View less" : "View all")}</Collapsible.Context>
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
