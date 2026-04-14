"use client"

import { Button, Card, HStack, Heading, Icon, Text, VStack } from "@chakra-ui/react"
import { getConfig } from "@repo/config"
import { humanAddress } from "@repo/utils/FormattingUtils"
import { XAllocationVoting__factory } from "@vechain/vebetterdao-contracts/factories/x-allocation-voting-governance/XAllocationVoting__factory"
import { ethers } from "ethers"
import { Sparks } from "iconoir-react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { useUserVotesInAllRounds } from "@/api/contracts/xApps/hooks/useUserVotesInAllRounds"
import { useXApps } from "@/api/contracts/xApps/hooks/useXApps"
import { AppImage } from "@/components/AppImage/AppImage"
import HandPlantIcon from "@/components/Icons/svg/hand-plant.svg"
import { EmptyState } from "@/components/ui/empty-state"
import { useEvents } from "@/hooks/useEvents"

import { NavigatorRoundVotesModal } from "./modals/NavigatorRoundVotesModal"

const PREVIEW_ROUNDS = 5

export type RoundVote = {
  roundId: string
  apps: { appId: string; appName?: string; votes: number }[]
  freshnessLabel?: string
  isFirstVote?: boolean
  isUpdated?: boolean
}

function groupVotesByRound(
  voteEvents: { roundId: string; appsIds: string[]; voteWeights: string[] }[],
  allApps: { id: string; name: string }[] | undefined,
): RoundVote[] {
  const roundMap = new Map<string, Map<string, number>>()

  for (const event of voteEvents) {
    if (event.appsIds.length !== event.voteWeights.length) continue
    const existing = roundMap.get(event.roundId) ?? new Map<string, number>()
    event.appsIds.forEach((appId, i) => {
      existing.set(appId, (existing.get(appId) ?? 0) + Number(ethers.formatEther(event.voteWeights[i] ?? "0")))
    })
    roundMap.set(event.roundId, existing)
  }

  return Array.from(roundMap.entries())
    .sort(([a], [b]) => Number(b) - Number(a))
    .map(([roundId, appsMap]) => ({
      roundId,
      apps: Array.from(appsMap.entries())
        .sort(([, a], [, b]) => b - a)
        .map(([appId, votes]) => ({
          appId,
          appName: allApps?.find(a => a.id === appId)?.name,
          votes,
        })),
    }))
}

type Props = {
  address: string
}

export const NavigatorRoundVotesCard = ({ address }: Props) => {
  const { t } = useTranslation()
  const { data: voteEvents } = useUserVotesInAllRounds(address)
  const { data: xApps } = useXApps()
  const [selectedRound, setSelectedRound] = useState<RoundVote | null>(null)
  const [visibleCount, setVisibleCount] = useState(PREVIEW_ROUNDS)

  const { data: freshnessEvents } = useEvents({
    abi: XAllocationVoting__factory.abi,
    contractAddress: getConfig().xAllocationVotingContractAddress,
    eventName: "FreshnessMultiplierApplied",
    filterParams: { voter: address as `0x${string}` },
    select: events =>
      events.map(({ decodedData }) => ({
        roundId: decodedData.args.roundId.toString(),
        multiplier: Number(decodedData.args.multiplier),
        lastChangedRound: Number(decodedData.args.lastChangedRound),
      })),
    enabled: !!address,
  })

  const freshnessByRound = useMemo(() => {
    const map = new Map<string, { label: string; isFirstVote: boolean; isUpdated: boolean }>()
    if (!freshnessEvents) return map
    for (const e of freshnessEvents) {
      const label = `x${e.multiplier / 10000}`
      const roundsSinceChange = Number(e.roundId) - e.lastChangedRound
      map.set(e.roundId, {
        label,
        isFirstVote: e.lastChangedRound === 0,
        isUpdated: roundsSinceChange === 0,
      })
    }
    return map
  }, [freshnessEvents])

  const roundVotes = useMemo(() => {
    const grouped = groupVotesByRound(voteEvents ?? [], xApps?.allApps)
    return grouped.map(round => {
      const freshness = freshnessByRound.get(round.roundId)
      return {
        ...round,
        freshnessLabel: freshness?.label,
        isFirstVote: freshness?.isFirstVote,
        isUpdated: freshness?.isUpdated,
      }
    })
  }, [voteEvents, xApps?.allApps, freshnessByRound])

  const visibleRounds = roundVotes.slice(0, visibleCount)
  const hasMore = visibleCount < roundVotes.length

  if (roundVotes.length === 0) {
    return (
      <Card.Root variant="primary" w="full" h="full">
        <Card.Body asChild>
          <EmptyState
            title={t("Voted apps")}
            description={t("{{subject}} voted apps will appear here.", {
              subject: `${humanAddress(address, 4, 3)}`,
            })}
            icon={
              <Icon boxSize={20} color="actions.secondary.text-lighter">
                <HandPlantIcon color="rgba(117, 117, 117, 1)" />
              </Icon>
            }
          />
        </Card.Body>
      </Card.Root>
    )
  }

  return (
    <>
      <Card.Root w="full" variant="primary">
        <Card.Body>
          <Heading size="md" mb={{ base: 2, md: 4 }}>
            {t("Voted apps")}
          </Heading>

          <VStack gap={3} w="full" align="stretch">
            {visibleRounds.map(round => (
              <Card.Root
                key={round.roundId}
                variant="subtle"
                cursor="pointer"
                onClick={() => setSelectedRound(round)}
                p={3}>
                <Card.Body flexDirection="row" justifyContent="space-between" alignItems="center" p={0}>
                  <VStack align="start" gap={0.5}>
                    <Text textStyle="sm" fontWeight="semibold">
                      {t("Round #{{round}}", { round: round.roundId })}
                    </Text>
                    <HStack gap={1.5}>
                      <Text textStyle="xs" color="text.subtle">
                        {`${round.apps.length} ${t("apps")}`}
                      </Text>
                      {round.freshnessLabel && (
                        <>
                          <Text textStyle="xs" color="text.subtle" aria-hidden>
                            {"·"}
                          </Text>
                          <HStack gap={0.5}>
                            <Icon as={Sparks} boxSize={3} color="text.subtle" />
                            <Text textStyle="xs" color="text.subtle">
                              {round.freshnessLabel}
                            </Text>
                          </HStack>
                        </>
                      )}
                    </HStack>
                  </VStack>
                  <HStack gap={-1}>
                    {round.apps.slice(0, 5).map(app => (
                      <AppImage
                        key={app.appId}
                        appId={app.appId}
                        boxSize="7"
                        shape="rounded"
                        borderRadius="full"
                        ml="-1.5"
                        border="2px solid"
                        borderColor="bg.subtle"
                      />
                    ))}
                    {round.apps.length > 5 && (
                      <Text textStyle="xs" color="text.subtle" ml={1}>
                        {`+${round.apps.length - 5}`}
                      </Text>
                    )}
                  </HStack>
                </Card.Body>
              </Card.Root>
            ))}

            {hasMore && (
              <Button
                variant="link"
                size="sm"
                fontWeight="semibold"
                onClick={() => setVisibleCount(prev => prev + PREVIEW_ROUNDS)}>
                {t("Show more")}
              </Button>
            )}
          </VStack>
        </Card.Body>
      </Card.Root>

      <NavigatorRoundVotesModal isOpen={!!selectedRound} onClose={() => setSelectedRound(null)} round={selectedRound} />
    </>
  )
}
