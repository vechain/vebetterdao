import {
  Badge,
  Box,
  Card,
  Heading,
  HStack,
  Mark,
  SimpleGrid,
  Skeleton,
  Text,
  useToken,
  VStack,
  Wrap,
} from "@chakra-ui/react"
import { compareAddresses } from "@repo/utils/AddressUtils"
import { getCompactFormatter, humanAddress, humanDomain, humanNumber } from "@repo/utils/FormattingUtils"
import { getPicassoImgSrc } from "@repo/utils/PicassoUtils"
import { useWallet } from "@vechain/vechain-kit"
import { useRouter } from "next/navigation"
import { useCallback, useMemo } from "react"
import Countdown from "react-countdown"
import { useTranslation } from "react-i18next"
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import {
  ChallengeDetail,
  ChallengeStatus,
  ChallengeType,
  ChallengeVisibility,
  SettlementMode,
} from "@/api/challenges/types"
import { useChallengeParticipantActions } from "@/api/challenges/useChallengeParticipantActions"
import { useCurrentAllocationsRoundDeadline } from "@/api/contracts/xAllocations/hooks/useCurrentAllocationsRoundDeadline"
import { AddressIcon } from "@/components/AddressIcon"
import { useBestBlockCompressed } from "@/hooks/useGetBestBlockCompressed"
import { useGetVetDomains } from "@/hooks/useGetVetDomains"
import { blockNumberToDate } from "@/utils/date"

import { ChallengeStatTile } from "../../shared/ChallengeStatTile"

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

const AddressBadgeGroup = ({
  title,
  addresses,
  domainMap,
  onAddressClick,
}: {
  title: string
  addresses: string[]
  domainMap: Record<string, string>
  onAddressClick: (address: string) => void
}) => {
  return (
    <Box
      bg="bg.secondary"
      borderRadius="2xl"
      border="sm"
      borderColor="border.secondary"
      px={{ base: "4", md: "5" }}
      py="4">
      <VStack align="stretch" gap="3">
        <HStack justify="space-between" gap="3">
          <Text
            textStyle="xxs"
            color="text.subtle"
            textTransform="uppercase"
            letterSpacing="0.08em"
            fontWeight="semibold">
            {title}
          </Text>
          <Badge variant="neutral" size="sm">
            {humanNumber(addresses.length)}
          </Badge>
        </HStack>
        <Wrap gap="2">
          {addresses.map(address => {
            const domain = domainMap[address.toLowerCase()]

            return (
              <Badge
                key={address}
                variant="neutral"
                size="sm"
                title={address}
                cursor="pointer"
                role="button"
                tabIndex={0}
                _hover={{ opacity: 0.8 }}
                onClick={() => onAddressClick(address)}
                onKeyDown={event => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault()
                    onAddressClick(address)
                  }
                }}>
                <HStack gap="1.5">
                  <AddressIcon address={address} boxSize="4" borderRadius="full" flexShrink={0} />
                  <Text textStyle="xs">{domain ? humanDomain(domain, 8, 4) : humanAddress(address, 6, 4)}</Text>
                </HStack>
              </Badge>
            )
          })}
        </Wrap>
      </VStack>
    </Box>
  )
}

export const ChallengeParticipantActionsSection = ({ challenge }: { challenge: ChallengeDetail }) => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const router = useRouter()
  const openProfile = useCallback((address: string) => router.push(`/profile/${address}`), [router])
  const viewerAddress = account?.address
  const { leaderboard, totalActions, isLoading, isError } = useChallengeParticipantActions(
    challenge.challengeId,
    challenge.participants,
  )
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
  const uniqueChallengeAddresses = useMemo(() => {
    const seen = new Set<string>()

    return [...challenge.participants, ...challenge.invited, ...challenge.declined].filter(address => {
      const normalizedAddress = address.toLowerCase()
      if (seen.has(normalizedAddress)) return false
      seen.add(normalizedAddress)
      return true
    })
  }, [challenge.declined, challenge.invited, challenge.participants])
  const { data: vetDomains } = useGetVetDomains(
    uniqueChallengeAddresses.length > 0 ? uniqueChallengeAddresses : undefined,
  )
  const isPending = challenge.status === ChallengeStatus.Pending
  const domainMap = useMemo(() => {
    const map: Record<string, string> = {}
    if (!vetDomains) return map

    uniqueChallengeAddresses.forEach((address, index) => {
      const domain = vetDomains[index]
      if (domain) map[address.toLowerCase()] = domain
    })

    return map
  }, [uniqueChallengeAddresses, vetDomains])
  const showInviteStats = challenge.visibility === ChallengeVisibility.Private
  const hasAddressLists =
    challenge.participants.length > 0 ||
    (showInviteStats && (challenge.invited.length > 0 || challenge.declined.length > 0))
  const addressGroupCount = [challenge.participants.length, challenge.invited.length, challenge.declined.length].filter(
    (count, index) => count > 0 && (showInviteStats || index === 0),
  ).length

  const roundStartDate = useMemo(() => {
    if (!isPending || deadlineBlock == null || !bestBlock) return null
    return blockNumberToDate(BigInt(deadlineBlock), bestBlock)
  }, [isPending, deadlineBlock, bestBlock])

  const isSplitWin = challenge.challengeType === ChallengeType.SplitWin
  const winnerAddresses = useMemo(() => {
    // Split Win winners come straight from the contract list (claim order).
    if (isSplitWin) return challenge.winners

    if (challenge.status !== ChallengeStatus.Completed || challenge.settlementMode === SettlementMode.CreatorRefund)
      return []

    const bestScore = leaderboard[0]?.actions
    return typeof bestScore === "number"
      ? leaderboard.filter(entry => entry.actions === bestScore).map(entry => entry.participant)
      : []
  }, [isSplitWin, challenge.winners, challenge.settlementMode, challenge.status, leaderboard])

  const chartData = useMemo<ChartEntry[]>(() => {
    const bestScore = leaderboard[0]?.actions ?? 0

    return leaderboard.map(entry => {
      const isWinner =
        challenge.status === ChallengeStatus.Completed || isSplitWin
          ? winnerAddresses.some(address => compareAddresses(address, entry.participant))
          : leaderboard.length > 0 && entry.actions === bestScore

      return {
        participant: entry.participant,
        label: humanAddress(entry.participant, 4, 4),
        actions: entry.actions,
        fill: isWinner ? leaderColor : trailingColor,
      }
    })
  }, [challenge.status, isSplitWin, leaderColor, leaderboard, trailingColor, winnerAddresses])

  const outcome = useMemo(() => {
    // Split Win surfaces winners as soon as anyone claims (live, even while Active).
    if (isSplitWin) {
      if (winnerAddresses.length === 0) return null
      return {
        kind: "winner" as const,
        addresses: winnerAddresses,
        isViewerWinner: !!viewerAddress && winnerAddresses.some(address => compareAddresses(address, viewerAddress)),
      }
    }

    if (challenge.status !== ChallengeStatus.Completed) return null

    if (challenge.settlementMode === SettlementMode.CreatorRefund) {
      return {
        kind: "payout" as const,
        addresses: [challenge.creator],
        isViewerWinner: false,
      }
    }

    return {
      kind: "winner" as const,
      addresses: winnerAddresses,
      isViewerWinner: !!viewerAddress && winnerAddresses.some(address => compareAddresses(address, viewerAddress)),
    }
  }, [isSplitWin, challenge.creator, challenge.settlementMode, challenge.status, viewerAddress, winnerAddresses])

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
        </VStack>

        <SimpleGrid columns={showInviteStats ? { base: 2, lg: 3 } : 1} gap="3">
          {showInviteStats && <ChallengeStatTile label={t("Invited")} value={humanNumber(challenge.invited.length)} />}
          {showInviteStats && (
            <ChallengeStatTile label={t("Declined")} value={humanNumber(challenge.declined.length)} />
          )}
          <ChallengeStatTile
            label={isPending ? t("Rounds") : t("total actions")}
            value={
              isPending
                ? `${humanNumber(challenge.startRound)} → ${humanNumber(challenge.endRound)}`
                : compactFormatter.format(totalActions)
            }
          />
        </SimpleGrid>

        {outcome && outcome.addresses.length > 0 && (
          <Box
            bg="bg.secondary"
            borderRadius="2xl"
            border="sm"
            borderColor="border.secondary"
            px={{ base: "4", md: "5" }}
            py="4">
            <VStack align="stretch" gap="3">
              <Text
                textStyle="xxs"
                color="text.subtle"
                textTransform="uppercase"
                letterSpacing="0.08em"
                fontWeight="semibold">
                {t("B3MO Quest outcome")}
              </Text>
              {outcome.kind === "winner" && viewerAddress && (
                <Text textStyle="sm" fontWeight="semibold">
                  {t(outcome.isViewerWinner ? "You won this B3MO Quest" : "You did not win this B3MO Quest")}
                </Text>
              )}
              {outcome.kind === "payout" && (
                <Text textStyle="sm" fontWeight="semibold">
                  {t("No participant won this B3MO Quest")}
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
                    <Badge
                      key={address}
                      variant="neutral"
                      size="sm"
                      title={address}
                      cursor="pointer"
                      role="button"
                      tabIndex={0}
                      _hover={{ opacity: 0.8 }}
                      onClick={() => openProfile(address)}
                      onKeyDown={event => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault()
                          openProfile(address)
                        }
                      }}>
                      <HStack gap="1.5">
                        <AddressIcon address={address} boxSize="4" borderRadius="full" flexShrink={0} />
                        <Text textStyle="xs">{humanAddress(address, 6, 4)}</Text>
                      </HStack>
                    </Badge>
                  ))}
                </HStack>
              </VStack>
            </VStack>
          </Box>
        )}

        {hasAddressLists && (
          <SimpleGrid columns={addressGroupCount > 1 ? { base: 1, xl: 2 } : 1} gap="3">
            {challenge.participants.length > 0 && (
              <AddressBadgeGroup
                title={t("Participants")}
                addresses={challenge.participants}
                domainMap={domainMap}
                onAddressClick={openProfile}
              />
            )}
            {showInviteStats && challenge.invited.length > 0 && (
              <AddressBadgeGroup
                title={t("Invited wallets")}
                addresses={challenge.invited}
                domainMap={domainMap}
                onAddressClick={openProfile}
              />
            )}
            {showInviteStats && challenge.declined.length > 0 && (
              <AddressBadgeGroup
                title={t("Declined")}
                addresses={challenge.declined}
                domainMap={domainMap}
                onAddressClick={openProfile}
              />
            )}
          </SimpleGrid>
        )}

        {isLoading ? (
          <Skeleton h="320px" borderRadius="2xl" />
        ) : isPending ? (
          <Box
            bg="bg.secondary"
            borderRadius="2xl"
            border="sm"
            borderColor="border.secondary"
            px={{ base: "4", md: "5" }}
            py="4">
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
          <Box
            bg="bg.secondary"
            borderRadius="2xl"
            border="sm"
            borderColor="border.secondary"
            px={{ base: "4", md: "5" }}
            py="4">
            <Text textStyle="sm" color="text.subtle">
              {t("No round data available yet")}
            </Text>
          </Box>
        ) : !chartData.length ? (
          <Box
            bg="bg.secondary"
            borderRadius="2xl"
            border="sm"
            borderColor="border.secondary"
            px={{ base: "4", md: "5" }}
            py="4">
            <Text textStyle="sm" color="text.subtle">
              {t("None yet")}
            </Text>
          </Box>
        ) : (
          <Box
            bg="bg.secondary"
            borderRadius="2xl"
            border="sm"
            borderColor="border.secondary"
            p={{ base: "4", md: "5" }}>
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
                    onClick={data => {
                      const participant = data.payload?.participant as string | undefined
                      if (participant) router.push(`/profile/${participant}`)
                    }}>
                    {chartData.map(entry => (
                      <Cell key={entry.participant} fill={entry.fill} />
                    ))}
                    <LabelList
                      dataKey="actions"
                      position="right"
                      formatter={value => (typeof value === "number" ? compactFormatter.format(value) : (value ?? ""))}
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
