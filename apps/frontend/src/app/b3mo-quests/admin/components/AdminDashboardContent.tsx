"use client"
/* eslint-disable react/jsx-no-literals -- internal-only dashboard, not user-facing copy */

import {
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
  VStack,
} from "@chakra-ui/react"
import { humanAddress, humanNumber } from "@repo/utils/FormattingUtils"
import { formatEther } from "ethers"
import { useMemo, useState } from "react"
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

// Status-specific colors matching VeBetterDAO semantic palette
const STATUS_COLORS: Record<number, string> = {
  0: "#3B82F6", // Pending — blue
  1: "#10B981", // Active — green
  2: "#14B8A6", // Completed — teal
  3: "#F59E0B", // Cancelled — amber
  4: "#EF4444", // Invalid — red
}
// Generic graph palette for non-status breakdowns
const GRAPH_COLORS = ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#14B8A6"]

const ALL_ROUNDS = "all" as const
type RoundFilter = number | typeof ALL_ROUNDS

const fmtB3tr = (wei: bigint) => humanNumber(formatEther(wei))

export const AdminDashboardContent = () => {
  const { data: challenges, isLoading, isError, error } = useAllChallenges()
  const { data: currentRoundId } = useCurrentAllocationsRoundId()
  const [roundFilter, setRoundFilter] = useState<RoundFilter>(ALL_ROUNDS)

  const aggregate = useMemo<ChallengesAggregate | null>(
    () =>
      challenges
        ? aggregateChallenges(challenges, roundFilter === ALL_ROUNDS ? undefined : { endRound: roundFilter })
        : null,
    [challenges, roundFilter],
  )

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
              rounds={aggregate.rounds}
              value={roundFilter}
              currentRound={currentRoundId ? Number(currentRoundId) : undefined}
              onChange={setRoundFilter}
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
                colorMap={STATUS_COLORS}
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
  rounds: number[]
  value: RoundFilter
  currentRound?: number
  onChange: (v: RoundFilter) => void
}) => (
  <Card.Root variant="outline">
    <Card.Body>
      <Stack direction={{ base: "column", md: "row" }} align={{ base: "stretch", md: "center" }} gap={3}>
        <Text textStyle="sm" color="text.subtle" minW="120px">
          Filter by endRound
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
          {rounds.map(r => (
            <option key={r} value={r}>
              Round {r}
              {currentRound === r ? " (current)" : ""}
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
  colorMap,
}: {
  title: string
  labels: [K, string][]
  counts: Map<K, number>
  total: number
  colorMap?: Record<number, string>
}) => {
  const pieData = labels.map(([key, label], i) => ({
    name: label,
    value: counts.get(key) ?? 0,
    color: colorMap?.[key] ?? GRAPH_COLORS[i % GRAPH_COLORS.length] ?? "#6366F1",
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
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={
                  ((value: number, name: string) => {
                    const pct = total > 0 ? ((value / total) * 100).toFixed(1) : "0.0"
                    return [`${value} (${pct}%)`, name]
                  }) as any
                }
              />
            </PieChart>
          </ResponsiveContainer>
        )}
        <chakra.div mt={hasData ? 2 : 0} display="flex" flexWrap="wrap" gap={3} rowGap={1}>
          {labels.map(([key, label], i) => {
            const color = colorMap?.[key] ?? GRAPH_COLORS[i % GRAPH_COLORS.length] ?? "#6366F1"
            return (
              <HStack key={String(key)} gap={1.5}>
                <chakra.span
                  display="inline-block"
                  w="8px"
                  h="8px"
                  borderRadius="full"
                  flexShrink={0}
                  style={{ backgroundColor: color }}
                />
                <Text textStyle="xs">{label}</Text>
              </HStack>
            )
          })}
        </chakra.div>
      </Card.Body>
    </Card.Root>
  )
}

const ParticipationCard = ({ aggregate }: { aggregate: ChallengesAggregate }) => {
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
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
            <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
            <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} width={96} />
            <Tooltip formatter={((v: number) => [v, ""]) as never} />
            <Bar dataKey="value" fill="#6366F1" radius={[0, 4, 4, 0]} />
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
  const barData = STATUS_ORDER.map(s => ({
    label: challengeStatusLabel(s),
    b3tr: Number(formatEther(aggregate.totalPrizeByStatus.get(s) ?? 0n)),
    count: aggregate.byStatus.get(s) ?? 0,
    color: STATUS_COLORS[s],
  }))

  return (
    <Card.Root variant="outline">
      <Card.Body>
        <Heading size="sm" mb={4}>
          Total B3TR (totalPrize) by status
        </Heading>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={barData} layout="vertical" margin={{ left: 8, right: 60, top: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
            <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => humanNumber(v)} />
            <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} width={96} />
            <Tooltip
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={
                ((v: number, _name: string, props: any) => [
                  `${humanNumber(v)} B3TR (${props.payload?.count ?? 0} quests)`,
                  "Total prize",
                ]) as never
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

const TopCreatorsCard = ({ aggregate }: { aggregate: ChallengesAggregate }) => {
  const barData = aggregate.topCreators.map((c, i) => ({
    label: humanAddress(c.address, 4, 4),
    value: c.count,
    color: GRAPH_COLORS[i % GRAPH_COLORS.length] ?? "#6366F1",
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
          <>
            <ResponsiveContainer width="100%" height={Math.max(160, aggregate.topCreators.length * 32)}>
              <BarChart data={barData} layout="vertical" margin={{ left: 8, right: 32, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} width={120} fontFamily="monospace" />
                <Tooltip formatter={((v: number) => [v, "Quests"]) as never} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {barData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </>
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
