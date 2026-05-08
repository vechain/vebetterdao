"use client"
/* eslint-disable react/jsx-no-literals -- internal-only dashboard, not user-facing copy */

import {
  Box,
  Card,
  chakra,
  Container,
  Heading,
  HStack,
  Skeleton,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
  useToken,
  VStack,
} from "@chakra-ui/react"
import { humanAddress, humanNumber } from "@repo/utils/FormattingUtils"
import { formatEther } from "ethers"
import { useEffect, useMemo, useState } from "react"
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import { aggregateChallenges, ChallengesAggregate } from "@/api/challenges/aggregateChallenges"
import {
  ChallengeKind,
  ChallengeStatus,
  ChallengeType,
  ChallengeVisibility,
  SettlementMode,
  challengeStatusLabel,
} from "@/api/challenges/types"
import { useAllChallenges } from "@/api/challenges/useAllChallenges"
import { useCurrentAllocationsRoundId } from "@/api/contracts/xAllocations/hooks/useCurrentAllocationsRoundId"

const STATUS_ORDER: ChallengeStatus[] = [
  ChallengeStatus.Pending,
  ChallengeStatus.Active,
  ChallengeStatus.Completed,
  ChallengeStatus.Cancelled,
  ChallengeStatus.Invalid,
]
const KIND_LABELS: Record<ChallengeKind, string> = { 0: "Stake", 1: "Sponsored" }
const TYPE_LABELS: Record<ChallengeType, string> = { 0: "MaxActions", 1: "SplitWin" }
const VISIBILITY_LABELS: Record<ChallengeVisibility, string> = { 0: "Public", 1: "Private" }
const SETTLEMENT_LABELS: Record<SettlementMode, string> = {
  0: "Not settled",
  1: "Top winners paid",
  2: "Creator refunded",
  3: "Split-win paid",
}

// Status-specific token keys (resolved via useToken at render time)
const STATUS_TOKENS: Record<number, string> = {
  0: "blue.500",
  1: "green.500",
  2: "teal.500",
  3: "orange.400",
  4: "red.500",
}
const GRAPH_TOKENS = ["purple.500", "green.500", "orange.400", "red.500", "blue.500", "teal.500"]
const NEUTRAL_TOKENS = { axis: "gray.400", grid: "gray.200" }

const FIRST_QUEST_ROUND = 95

const ALL_ROUNDS = "all" as const
type RoundFilter = number | typeof ALL_ROUNDS

const fmtB3tr = (wei: bigint) => humanNumber(formatEther(wei))

// Resolve every chart token in one place so each card doesn't repeat the lookup.
const useChartColors = () => {
  const allKeys = [...Object.values(STATUS_TOKENS), ...GRAPH_TOKENS, NEUTRAL_TOKENS.axis, NEUTRAL_TOKENS.grid]
  const unique = [...new Set(allKeys)]
  const resolved = useToken("colors", unique)
  const map = Object.fromEntries(unique.map((k, i) => [k, resolved[i] ?? "#6366F1"])) as Record<string, string>
  return {
    status: Object.fromEntries(Object.entries(STATUS_TOKENS).map(([k, v]) => [k, map[v]])) as Record<number, string>,
    graph: GRAPH_TOKENS.map(t => map[t] ?? "#6366F1"),
    axis: map[NEUTRAL_TOKENS.axis] ?? "#A0AEC0",
    grid: map[NEUTRAL_TOKENS.grid] ?? "#E2E8F0",
  }
}

// Chakra-styled tooltip used for every chart on the page so they match the rest
// of the design system (matches RewardHistoryChart on the app detail page).
type TooltipPayload = { value: number; name?: string; payload?: Record<string, unknown>; color?: string }
const ChartTooltip = ({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean
  payload?: TooltipPayload[]
  label?: string | number
  formatter?: (entry: TooltipPayload) => { value: string; name?: string }
}) => {
  if (!active || !payload?.length) return null
  return (
    <Box
      bg="white"
      _dark={{ bg: "gray.800" }}
      border="1px solid"
      borderColor="border"
      borderRadius="lg"
      p={3}
      boxShadow="lg">
      {label !== undefined && (
        <Text textStyle="xs" fontWeight="semibold" mb={1}>
          {label}
        </Text>
      )}
      {payload.map((entry, i) => {
        const formatted = formatter ? formatter(entry) : { value: String(entry.value), name: entry.name }
        return (
          <HStack key={i} gap={1.5}>
            {entry.color && (
              <chakra.span
                display="inline-block"
                w="8px"
                h="8px"
                borderRadius="full"
                style={{ backgroundColor: entry.color }}
              />
            )}
            <Text textStyle="xs" color="text.subtle">
              {formatted.name ? `${formatted.name}: ` : ""}
              {formatted.value}
            </Text>
          </HStack>
        )
      })}
    </Box>
  )
}

export const AdminDashboardContent = () => {
  const { data: challenges, isLoading, isError, error } = useAllChallenges()
  const { data: currentRoundId } = useCurrentAllocationsRoundId()
  const [roundFilter, setRoundFilter] = useState<RoundFilter>(ALL_ROUNDS)
  const [hasUserFiltered, setHasUserFiltered] = useState(false)

  // Default to current round once it loads, unless user already changed the filter
  useEffect(() => {
    if (!hasUserFiltered && currentRoundId) {
      setRoundFilter(Number(currentRoundId))
    }
  }, [currentRoundId, hasUserFiltered])

  const aggregate = useMemo<ChallengesAggregate | null>(
    () =>
      challenges
        ? aggregateChallenges(challenges, roundFilter === ALL_ROUNDS ? undefined : { activeInRound: roundFilter })
        : null,
    [challenges, roundFilter],
  )

  // Range from launch round (95) to the latest round that either is the current
  // allocation round OR has at least one quest ending in it — quests can be created
  // with endRound > currentRound (scheduled), so we include those future rounds too.
  // Each entry carries the count of quests active during that round.
  const allRounds = useMemo<{ round: number; activeCount: number }[]>(() => {
    const current = currentRoundId ? Number(currentRoundId) : null
    if (!current || current < FIRST_QUEST_ROUND) return []
    const maxQuestRound = challenges?.reduce((m, c) => Math.max(m, c.endRound), 0) ?? 0
    const last = Math.max(current, maxQuestRound)
    const range = Array.from({ length: last - FIRST_QUEST_ROUND + 1 }, (_, i) => last - i)
    return range.map(round => ({
      round,
      activeCount: challenges?.filter(c => c.startRound <= round && c.endRound >= round).length ?? 0,
    }))
  }, [currentRoundId, challenges])

  return (
    <Container maxW="6xl" py={{ base: 4, md: 8 }}>
      <VStack align="stretch" gap={6}>
        <VStack align="start" gap={1}>
          <Text textStyle="xs" color="text.subtle" textTransform="uppercase" fontWeight="semibold">
            Internal — Quests Stats
          </Text>
          <Heading size={{ base: "xl", md: "2xl" }}>B3MO Quests dashboard</Heading>
          <Text textStyle="sm" color="text.subtle">
            Current allocation round: <b>{currentRoundId ?? "—"}</b>
          </Text>
        </VStack>

        {isError && (
          <Card.Root variant="outline">
            <Card.Body>
              <Text color="status.negative.strong">Failed to load: {(error as Error)?.message ?? "unknown error"}</Text>
            </Card.Body>
          </Card.Root>
        )}

        {isLoading && (
          <HStack>
            <Spinner size="sm" />
            <Text textStyle="sm" color="text.subtle">
              Reading quests from chain…
            </Text>
          </HStack>
        )}

        {aggregate && challenges && (
          <>
            <RoundSelector
              rounds={allRounds}
              value={roundFilter}
              currentRound={currentRoundId ? Number(currentRoundId) : undefined}
              onChange={v => {
                setHasUserFiltered(true)
                setRoundFilter(v)
              }}
            />

            <SimpleGrid columns={{ base: 2, md: 4 }} gap={3}>
              <KpiCard label="Total quests" value={aggregate.total.toString()} />
              <KpiCard label="Total B3TR (totalPrize)" value={fmtB3tr(aggregate.totalPrize)} />
              <KpiCard
                label="Avg participants / quest"
                value={aggregate.total ? (aggregate.sumParticipants / aggregate.total).toFixed(2) : "0"}
              />
              <KpiCard label="Sum participants" value={aggregate.sumParticipants.toString()} />
            </SimpleGrid>

            <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
              <BreakdownCard
                title="By status"
                labels={STATUS_ORDER.map(s => [s, challengeStatusLabel(s)])}
                counts={aggregate.byStatus}
                total={aggregate.total}
                useStatusColors
              />
              <BreakdownCard
                title="By kind"
                labels={[
                  [ChallengeKind.Stake, KIND_LABELS[0]],
                  [ChallengeKind.Sponsored, KIND_LABELS[1]],
                ]}
                counts={aggregate.byKind}
                total={aggregate.total}
              />
              <BreakdownCard
                title="By type"
                labels={[
                  [ChallengeType.MaxActions, TYPE_LABELS[0]],
                  [ChallengeType.SplitWin, TYPE_LABELS[1]],
                ]}
                counts={aggregate.byType}
                total={aggregate.total}
              />
              <BreakdownCard
                title="By visibility"
                labels={[
                  [ChallengeVisibility.Public, VISIBILITY_LABELS[0]],
                  [ChallengeVisibility.Private, VISIBILITY_LABELS[1]],
                ]}
                counts={aggregate.byVisibility}
                total={aggregate.total}
              />
              <BreakdownCard
                title="Payout outcome"
                labels={[
                  [SettlementMode.None, SETTLEMENT_LABELS[0]],
                  [SettlementMode.TopWinners, SETTLEMENT_LABELS[1]],
                  [SettlementMode.CreatorRefund, SETTLEMENT_LABELS[2]],
                  [SettlementMode.SplitWinCompleted, SETTLEMENT_LABELS[3]],
                ]}
                counts={aggregate.bySettlement}
                total={aggregate.total}
              />
              <ParticipationCard aggregate={aggregate} />
            </SimpleGrid>

            <PrizeByStatusCard aggregate={aggregate} />
            <PrizeByKindAndVisibilityCard aggregate={aggregate} />
            <TopCreatorsCard aggregate={aggregate} />
          </>
        )}

        {isLoading && !challenges && (
          <SimpleGrid columns={{ base: 2, md: 4 }} gap={3}>
            <Skeleton height="80px" />
            <Skeleton height="80px" />
            <Skeleton height="80px" />
            <Skeleton height="80px" />
          </SimpleGrid>
        )}
      </VStack>
    </Container>
  )
}

const RoundSelector = ({
  rounds,
  value,
  currentRound,
  onChange,
}: {
  rounds: { round: number; activeCount: number }[]
  value: RoundFilter
  currentRound?: number
  onChange: (v: RoundFilter) => void
}) => (
  <Card.Root variant="outline">
    <Card.Body>
      <Stack direction={{ base: "column", md: "row" }} align={{ base: "stretch", md: "center" }} gap={3}>
        <Text textStyle="sm" color="text.subtle" minW="120px">
          Filter by round
        </Text>
        <chakra.select
          value={value === ALL_ROUNDS ? ALL_ROUNDS : String(value)}
          onChange={e => onChange(e.target.value === ALL_ROUNDS ? ALL_ROUNDS : Number(e.target.value))}
          flex={1}
          p={2}
          borderRadius="md"
          bg="bg.secondary"
          color="text.default"
          borderWidth="1px"
          borderColor="border.primary">
          <option value={ALL_ROUNDS}>All rounds ({rounds.length})</option>
          {rounds.map(({ round, activeCount }) => (
            <option key={round} value={round}>
              Round {round}
              {currentRound === round ? " (current)" : ""} — {activeCount} active{" "}
              {activeCount === 1 ? "quest" : "quests"}
            </option>
          ))}
        </chakra.select>
      </Stack>
    </Card.Body>
  </Card.Root>
)

const KpiCard = ({ label, value }: { label: string; value: string }) => (
  <Card.Root variant="outline">
    <Card.Body p={4}>
      <Text textStyle="xs" color="text.subtle">
        {label}
      </Text>
      <Text textStyle={{ base: "lg", md: "xl" }} fontWeight="bold" mt={1}>
        {value}
      </Text>
    </Card.Body>
  </Card.Root>
)

const BreakdownCard = <K extends number>({
  title,
  labels,
  counts,
  total,
  useStatusColors,
}: {
  title: string
  labels: [K, string][]
  counts: Map<K, number>
  total: number
  useStatusColors?: boolean
}) => {
  const colors = useChartColors()
  const pickColor = (key: K, i: number) =>
    useStatusColors
      ? (colors.status[key] ?? colors.graph[0]!)
      : (colors.graph[i % colors.graph.length] ?? colors.graph[0]!)

  const pieData = labels.map(([key, label], i) => ({
    name: label,
    value: counts.get(key) ?? 0,
    color: pickColor(key, i),
    key,
  }))
  const hasData = pieData.some(d => d.value > 0)

  return (
    <Card.Root variant="outline">
      <Card.Body>
        <Heading size="sm" mb={3}>
          {title}
        </Heading>
        {hasData && (
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={2}>
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                content={
                  <ChartTooltip
                    formatter={entry => {
                      const pct = total > 0 ? ((entry.value / total) * 100).toFixed(1) : "0.0"
                      return { value: `${entry.value} (${pct}%)`, name: entry.name }
                    }}
                  />
                }
              />
            </PieChart>
          </ResponsiveContainer>
        )}
        <chakra.div mt={hasData ? 2 : 0} display="flex" flexWrap="wrap" gap={3} rowGap={1}>
          {pieData.map(({ key, name, color }) => (
            <HStack key={String(key)} gap={1.5}>
              <chakra.span
                display="inline-block"
                w="8px"
                h="8px"
                borderRadius="full"
                flexShrink={0}
                style={{ backgroundColor: color }}
              />
              <Text textStyle="xs">{name}</Text>
            </HStack>
          ))}
        </chakra.div>
      </Card.Body>
    </Card.Root>
  )
}

const ParticipationCard = ({ aggregate }: { aggregate: ChallengesAggregate }) => {
  const colors = useChartColors()
  const { total, sumParticipants, sumInvited, sumDeclined } = aggregate
  const avg = (n: number) => (total > 0 ? (n / total).toFixed(2) : "0.00")

  const barData = [
    { label: "Participants", value: sumParticipants },
    { label: "Invited", value: sumInvited },
    { label: "Declined", value: sumDeclined },
  ]

  return (
    <Card.Root variant="outline">
      <Card.Body>
        <Heading size="sm" mb={3}>
          Participation
        </Heading>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={barData} layout="vertical" margin={{ left: 8, right: 24, top: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={colors.grid} />
            <XAxis
              type="number"
              tick={{ fontSize: 11 }}
              allowDecimals={false}
              stroke={colors.axis}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="label"
              tick={{ fontSize: 11 }}
              width={96}
              stroke={colors.axis}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: colors.grid, opacity: 0.3 }}
              content={
                <ChartTooltip
                  formatter={entry => ({ value: humanNumber(entry.value), name: String(entry.payload?.label ?? "") })}
                />
              }
            />
            <Bar dataKey="value" fill={colors.graph[0]} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <VStack align="stretch" gap={1} mt={3}>
          <Row label="Avg participants/quest" value={avg(sumParticipants)} />
          <Row label="Avg invited/quest" value={avg(sumInvited)} />
          <Row label="Avg declined/quest" value={avg(sumDeclined)} />
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}

const PrizeByStatusCard = ({ aggregate }: { aggregate: ChallengesAggregate }) => {
  const colors = useChartColors()
  const barData = STATUS_ORDER.map(s => ({
    label: challengeStatusLabel(s),
    b3tr: Number(formatEther(aggregate.totalPrizeByStatus.get(s) ?? 0n)),
    count: aggregate.byStatus.get(s) ?? 0,
    color: colors.status[s] ?? colors.graph[0]!,
  }))

  return (
    <Card.Root variant="outline">
      <Card.Body>
        <Heading size="sm" mb={4}>
          Total B3TR (totalPrize) by status
        </Heading>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={barData} layout="vertical" margin={{ left: 8, right: 60, top: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={colors.grid} />
            <XAxis
              type="number"
              tick={{ fontSize: 11 }}
              tickFormatter={v => humanNumber(v)}
              stroke={colors.axis}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="label"
              tick={{ fontSize: 11 }}
              width={96}
              stroke={colors.axis}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: colors.grid, opacity: 0.3 }}
              content={
                <ChartTooltip
                  formatter={entry => ({
                    value: `${humanNumber(entry.value)} B3TR (${entry.payload?.count ?? 0} quests)`,
                    name: String(entry.payload?.label ?? "Total prize"),
                  })}
                />
              }
            />
            <Bar dataKey="b3tr" radius={[0, 4, 4, 0]}>
              {barData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card.Body>
    </Card.Root>
  )
}

const PrizeByKindAndVisibilityCard = ({ aggregate }: { aggregate: ChallengesAggregate }) => {
  const colors = useChartColors()

  const kindData = [
    {
      label: KIND_LABELS[ChallengeKind.Stake],
      b3tr: Number(formatEther(aggregate.totalPrizeByKind.get(ChallengeKind.Stake) ?? 0n)),
      count: aggregate.byKind.get(ChallengeKind.Stake) ?? 0,
      color: colors.graph[0]!,
    },
    {
      label: KIND_LABELS[ChallengeKind.Sponsored],
      b3tr: Number(formatEther(aggregate.totalPrizeByKind.get(ChallengeKind.Sponsored) ?? 0n)),
      count: aggregate.byKind.get(ChallengeKind.Sponsored) ?? 0,
      color: colors.graph[1]!,
    },
  ]

  const visibilityData = [
    {
      label: VISIBILITY_LABELS[ChallengeVisibility.Public],
      b3tr: Number(formatEther(aggregate.totalPrizeByVisibility.get(ChallengeVisibility.Public) ?? 0n)),
      count: aggregate.byVisibility.get(ChallengeVisibility.Public) ?? 0,
      color: colors.graph[2]!,
    },
    {
      label: VISIBILITY_LABELS[ChallengeVisibility.Private],
      b3tr: Number(formatEther(aggregate.totalPrizeByVisibility.get(ChallengeVisibility.Private) ?? 0n)),
      count: aggregate.byVisibility.get(ChallengeVisibility.Private) ?? 0,
      color: colors.graph[3]!,
    },
  ]

  const makeChart = (data: typeof kindData) => (
    <ResponsiveContainer width="100%" height={100}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 60, top: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={colors.grid} />
        <XAxis
          type="number"
          tick={{ fontSize: 11 }}
          tickFormatter={v => humanNumber(v)}
          stroke={colors.axis}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="label"
          tick={{ fontSize: 11 }}
          width={96}
          stroke={colors.axis}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: colors.grid, opacity: 0.3 }}
          content={
            <ChartTooltip
              formatter={entry => ({
                value: `${humanNumber(entry.value)} B3TR (${entry.payload?.count ?? 0} quests)`,
                name: String(entry.payload?.label ?? "Total prize"),
              })}
            />
          }
        />
        <Bar dataKey="b3tr" radius={[0, 4, 4, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )

  return (
    <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
      <Card.Root variant="outline">
        <Card.Body>
          <Heading size="sm" mb={4}>
            B3TR volume by kind
          </Heading>
          {makeChart(kindData)}
        </Card.Body>
      </Card.Root>
      <Card.Root variant="outline">
        <Card.Body>
          <Heading size="sm" mb={4}>
            B3TR volume by visibility
          </Heading>
          {makeChart(visibilityData)}
        </Card.Body>
      </Card.Root>
    </SimpleGrid>
  )
}

const TopCreatorsCard = ({ aggregate }: { aggregate: ChallengesAggregate }) => {
  const colors = useChartColors()
  const barData = aggregate.topCreators.map((c, i) => ({
    label: humanAddress(c.address, 4, 4),
    value: c.count,
    color: colors.graph[i % colors.graph.length] ?? colors.graph[0]!,
  }))

  return (
    <Card.Root variant="outline">
      <Card.Body>
        <Heading size="sm" mb={3}>
          Top creators by quest count
        </Heading>
        {aggregate.topCreators.length === 0 ? (
          <Text textStyle="sm" color="text.subtle">
            No quests in this view.
          </Text>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(160, aggregate.topCreators.length * 32)}>
            <BarChart data={barData} layout="vertical" margin={{ left: 8, right: 32, top: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={colors.grid} />
              <XAxis
                type="number"
                tick={{ fontSize: 11 }}
                allowDecimals={false}
                stroke={colors.axis}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="label"
                tick={{ fontSize: 11 }}
                width={120}
                fontFamily="monospace"
                stroke={colors.axis}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: colors.grid, opacity: 0.3 }}
                content={
                  <ChartTooltip
                    formatter={entry => ({
                      value: String(entry.value),
                      name: String(entry.payload?.label ?? "Quests"),
                    })}
                  />
                }
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {barData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card.Body>
    </Card.Root>
  )
}

const Row = ({ label, value }: { label: string; value: string }) => (
  <HStack justify="space-between">
    <Text textStyle="sm">{label}</Text>
    <Text textStyle="sm" color="text.subtle">
      {value}
    </Text>
  </HStack>
)
