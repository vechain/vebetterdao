"use client"

import { Button, Card, HStack, Text, VStack } from "@chakra-ui/react"
import { ethers } from "ethers"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { useUserVotesInAllRounds } from "@/api/contracts/xApps/hooks/useUserVotesInAllRounds"
import { useXApps } from "@/api/contracts/xApps/hooks/useXApps"
import { AppImage } from "@/components/AppImage/AppImage"

import { NavigatorRoundVotesModal } from "./NavigatorRoundVotesModal"

const PREVIEW_ROUNDS = 3

export type RoundVote = {
  roundId: string
  apps: { appId: string; appName?: string; votes: number }[]
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

  const roundVotes = useMemo(() => groupVotesByRound(voteEvents ?? [], xApps?.allApps), [voteEvents, xApps?.allApps])

  const visibleRounds = roundVotes.slice(0, visibleCount)
  const hasMore = visibleCount < roundVotes.length

  if (roundVotes.length === 0) return null

  return (
    <>
      <Card.Root w="full" variant="primary">
        <Card.Body>
          <Text textStyle={{ base: "lg", md: "xl" }} fontWeight="bold" mb={{ base: 2, md: 4 }}>
            {t("Allocation Rounds")}
          </Text>

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
                    <Text textStyle="xs" color="text.subtle">
                      {`${round.apps.length} ${t("apps")}`}
                    </Text>
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
                {t("View more")}
              </Button>
            )}
          </VStack>
        </Card.Body>
      </Card.Root>

      <NavigatorRoundVotesModal isOpen={!!selectedRound} onClose={() => setSelectedRound(null)} round={selectedRound} />
    </>
  )
}
