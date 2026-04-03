"use client"

import { Badge, Box, Card, Heading, HStack, Mark, Skeleton, Text, useToken, VStack } from "@chakra-ui/react"
import { compareAddresses } from "@repo/utils/AddressUtils"
import { getCompactFormatter, humanAddress, humanNumber } from "@repo/utils/FormattingUtils"
import { getPicassoImgSrc } from "@repo/utils/PicassoUtils"
import { useWallet } from "@vechain/vechain-kit"
import { useRouter } from "next/navigation"
import { useCallback, useMemo } from "react"
import Countdown from "react-countdown"
import { useTranslation } from "react-i18next"
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import { ChallengeDetail, ChallengeStatus, SettlementMode } from "@/api/challenges/types"
import { useChallengeParticipantActions } from "@/api/challenges/useChallengeParticipantActions"
import { useCurrentAllocationsRoundDeadline } from "@/api/contracts/xAllocations/hooks/useCurrentAllocationsRoundDeadline"
import { useBestBlockCompressed } from "@/hooks/useGetBestBlockCompressed"
import { blockNumberToDate } from "@/utils/date"

const compactFormatter = getCompactFormatter(1)

type ChartEntry = {
  participant: string
  label: string
  actions: number
  fill: string
}

const ChartTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: ChartEntry }[] }) => {
  const { t } = useTranslation()

  if (!active || !payload?.length) return null

  const entry = payload[0]?.payload
  if (!entry) return null

  return (
    <Box
      bg="white"
      _dark={{ bg: "gray.800" }}
      border="1px solid"
      borderColor="border.secondary"
      borderRadius="lg"
      p={3}
      boxShadow="lg">
      <Text textStyle="xs" fontWeight="semibold" mb={1}>
        {entry.participant}
      </Text>
      <Text textStyle="xs" color="text.subtle">
        {compactFormatter.format(entry.actions)} {t("Actions Rewarded")}
      </Text>
    </Box>
  )
}

export const ChallengeParticipantActionsSection = ({ challenge }: { challenge: ChallengeDetail }) => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const router = useRouter()
  const viewerAddress = account?.address
  const { data, isLoading, isError } = useChallengeParticipantActions(challenge.challengeId, challenge.participants)
  const [leaderColorToken, trailingColorToken, gridColorToken, axisColorToken] = useToken("colors", [
    "blue.600",
    "blue.200",
    "gray.200",
    "gray.400",
  ])
  const leaderColor = leaderColorToken ?? "#004CFC"
  const trailingColor = trailingColorToken ?? "#B3CCFF"
  const gridColor = gridColorToken ?? "#E7E9EB"
  const axisColor = axisColorToken ?? "#AAAFB6"
  const { data: deadlineBlock } = useCurrentAllocationsRoundDeadline()
  const { data: bestBlock } = useBestBlockCompressed()
  const leaderboard = data?.leaderboard ?? []
  const isPending = challenge.status === ChallengeStatus.Pending

  const roundStartDate = useMemo(() => {
    if (!isPending || deadlineBlock == null || !bestBlock) return null
    return blockNumberToDate(BigInt(deadlineBlock), bestBlock)
  }, [isPending, deadlineBlock, bestBlock])

  const chartData = useMemo<ChartEntry[]>(() => {
    const bestScore = leaderboard[0]?.actions ?? 0

    return leaderboard.map(entry => ({
      participant: entry.participant,
      label: humanAddress(entry.participant, 4, 4),
      actions: entry.actions,
      fill: leaderboard.length > 0 && entry.actions === bestScore ? leaderColor : trailingColor,
    }))
  }, [leaderColor, leaderboard, trailingColor])

  const outcome = useMemo(() => {
    if (challenge.status !== ChallengeStatus.Finalized) return null

    if (challenge.settlementMode === SettlementMode.CreatorRefund) {
      return {
        kind: "payout" as const,
        addresses: [challenge.creator],
        isViewerWinner: false,
      }
    }

    const addresses =
      challenge.settlementMode === SettlementMode.QualifiedSplit
        ? leaderboard.filter(entry => entry.actions >= Number(challenge.threshold)).map(entry => entry.participant)
        : (() => {
            const bestScore = leaderboard[0]?.actions
            return typeof bestScore === "number"
              ? leaderboard.filter(entry => entry.actions === bestScore).map(entry => entry.participant)
              : []
          })()

    return {
      kind: "winner" as const,
      addresses,
      isViewerWinner: !!viewerAddress && addresses.some(address => compareAddresses(address, viewerAddress)),
    }
  }, [challenge.creator, challenge.settlementMode, challenge.status, challenge.threshold, leaderboard, viewerAddress])

  const chartHeight = Math.max(220, chartData.length * 44)

  const renderYAxisTick = useCallback(
    ({ x, y, index }: { x: number; y: number; index: number }) => {
      const entry = chartData[index]
      if (!entry) return null
      const imgSrc = getPicassoImgSrc(entry.participant, true)
      const imgX = x - 122
      return (
        <g style={{ cursor: "pointer" }} onClick={() => router.push(`/profile/${entry.participant}`)}>
          <defs>
            <clipPath id={`av-${index}`}>
              <circle cx={imgX + 9} cy={y} r={9} />
            </clipPath>
          </defs>
          <rect x={imgX - 4} y={y - 14} width={x - imgX + 8} height={28} fill="transparent" />
          <image href={imgSrc} x={imgX} y={y - 9} width={18} height={18} clipPath={`url(#av-${index})`} />
          <text x={imgX + 26} y={y} textAnchor="start" fontSize={11} fill={axisColor} dominantBaseline="central">
            {entry.label}
          </text>
        </g>
      )
    },
    [chartData, axisColor, router],
  )

  return (
    <Card.Root variant="primary" p={{ base: "6", md: "7" }} gap="5" borderRadius="3xl" boxShadow="sm">
      <VStack align="stretch" gap="5">
        <VStack align="start" gap="1">
          <Text
            textStyle="xxs"
            color="text.subtle"
            textTransform="uppercase"
            letterSpacing="0.08em"
            fontWeight="semibold">
            {t("Participants")}
          </Text>
          <Heading size="2xl">
            {humanNumber(challenge.participantCount)} {"/"} {humanNumber(challenge.maxParticipants)}
          </Heading>
          {!isPending && (
            <Text textStyle="sm" color="text.subtle">
              {compactFormatter.format(data?.totalActions ?? 0)} {t("total actions")}
            </Text>
          )}
        </VStack>

        {outcome && outcome.addresses.length > 0 && (
          <Box bg="bg.secondary" borderRadius="2xl" px={{ base: "4", md: "5" }} py="4">
            <VStack align="stretch" gap="3">
              <Text
                textStyle="xxs"
                color="text.subtle"
                textTransform="uppercase"
                letterSpacing="0.08em"
                fontWeight="semibold">
                {t("Challenge outcome")}
              </Text>
              {outcome.kind === "winner" && viewerAddress && (
                <Text textStyle="sm" fontWeight="semibold">
                  {t(outcome.isViewerWinner ? "You won this challenge" : "You did not win this challenge")}
                </Text>
              )}
              {outcome.kind === "payout" && (
                <Text textStyle="sm" fontWeight="semibold">
                  {t("No participant won this challenge")}
                </Text>
              )}
              <VStack align="start" gap="2">
                <Text textStyle="xs" color="text.subtle">
                  {t(
                    outcome.kind === "payout"
                      ? outcome.addresses.length === 1
                        ? "Payout recipient"
                        : "Payout recipients"
                      : outcome.addresses.length === 1
                        ? "Winner"
                        : "Winners",
                  )}
                </Text>
                <HStack flexWrap="wrap" gap="2">
                  {outcome.addresses.map(address => (
                    <Badge key={address} variant="neutral" size="sm">
                      {humanAddress(address, 6, 4)}
                    </Badge>
                  ))}
                </HStack>
              </VStack>
            </VStack>
          </Box>
        )}

        {isLoading ? (
          <Skeleton h="320px" borderRadius="2xl" />
        ) : isPending ? (
          <Box bg="bg.secondary" borderRadius="2xl" px={{ base: "4", md: "5" }} py="4">
            <VStack gap="2" align="start">
              {roundStartDate ? (
                <Countdown
                  date={roundStartDate}
                  now={() => Date.now()}
                  renderer={({ days, hours, minutes, seconds }) => (
                    <VStack gap="1" align="start">
                      <Text
                        textStyle="xxs"
                        color="text.subtle"
                        textTransform="uppercase"
                        letterSpacing="0.08em"
                        fontWeight="semibold">
                        {t("Starts in")}
                      </Text>
                      <HStack gap="1">
                        {days > 0 && (
                          <>
                            <Mark variant="text" fontWeight="semibold" textStyle="lg">
                              {days}
                            </Mark>
                            <Text textStyle="sm" color="text.subtle">
                              {"d"}
                            </Text>
                          </>
                        )}
                        <Mark variant="text" fontWeight="semibold" textStyle="lg">
                          {hours}
                        </Mark>
                        <Text textStyle="sm" color="text.subtle">
                          {"h"}
                        </Text>
                        <Mark variant="text" fontWeight="semibold" textStyle="lg">
                          {minutes}
                        </Mark>
                        <Text textStyle="sm" color="text.subtle">
                          {"m"}
                        </Text>
                        <Mark variant="text" fontWeight="semibold" textStyle="lg">
                          {seconds}
                        </Mark>
                        <Text textStyle="sm" color="text.subtle">
                          {"s"}
                        </Text>
                      </HStack>
                    </VStack>
                  )}
                />
              ) : (
                <Text textStyle="sm" color="text.subtle">
                  {t("Waiting for the round to start")}
                </Text>
              )}
              <Text textStyle="xs" color="text.subtle">
                {t("Round {{start}} → {{end}}", { start: challenge.startRound, end: challenge.endRound })}
              </Text>
            </VStack>
          </Box>
        ) : isError ? (
          <Box bg="bg.secondary" borderRadius="2xl" px={{ base: "4", md: "5" }} py="4">
            <Text textStyle="sm" color="text.subtle">
              {t("No round data available yet")}
            </Text>
          </Box>
        ) : !chartData.length ? (
          <Box bg="bg.secondary" borderRadius="2xl" px={{ base: "4", md: "5" }} py="4">
            <Text textStyle="sm" color="text.subtle">
              {t("None yet")}
            </Text>
          </Box>
        ) : (
          <Box bg="bg.secondary" borderRadius="2xl" p={{ base: "4", md: "5" }}>
            <Box w="full" h={`${chartHeight}px`}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 44, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={140}
                    tick={renderYAxisTick}
                    tickMargin={12}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={false} />
                  <Bar
                    dataKey="actions"
                    radius={[0, 6, 6, 0]}
                    minPointSize={4}
                    cursor="pointer"
                    onClick={(data: ChartEntry) => router.push(`/profile/${data.participant}`)}>
                    {chartData.map(entry => (
                      <Cell key={entry.participant} fill={entry.fill} />
                    ))}
                    <LabelList
                      dataKey="actions"
                      position="right"
                      formatter={(value: number) => compactFormatter.format(value)}
                      fontSize={11}
                      fill={axisColor}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Box>
        )}
      </VStack>
    </Card.Root>
  )
}
