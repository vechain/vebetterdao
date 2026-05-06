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
  Table,
  Text,
  VStack,
} from "@chakra-ui/react"
import { humanAddress, humanNumber } from "@repo/utils/FormattingUtils"
import { formatEther } from "ethers"
import { useMemo, useState } from "react"

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
  0: "None",
  1: "TopWinners",
  2: "CreatorRefund",
  3: "SplitWinCompleted",
}

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
                title="By settlement mode"
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
      <Text textStyle="xs" color="text.subtle" lineClamp={1}>
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
}: {
  title: string
  labels: [K, string][]
  counts: Map<K, number>
  total: number
}) => (
  <Card.Root variant="outline">
    <Card.Body>
      <Heading size="sm" mb={3}>
        {title}
      </Heading>
      <VStack align="stretch" gap={2}>
        {labels.map(([key, label]) => {
          const c = counts.get(key) ?? 0
          const pct = total > 0 ? ((c / total) * 100).toFixed(1) : "0.0"
          return (
            <HStack key={String(key)} justify="space-between">
              <Text textStyle="sm">{label}</Text>
              <Text textStyle="sm" color="text.subtle">
                {c} ({pct}%)
              </Text>
            </HStack>
          )
        })}
      </VStack>
    </Card.Body>
  </Card.Root>
)

const ParticipationCard = ({ aggregate }: { aggregate: ChallengesAggregate }) => {
  const { total, sumParticipants, sumInvited, sumDeclined } = aggregate
  const avg = (n: number) => (total > 0 ? (n / total).toFixed(2) : "0.00")
  return (
    <Card.Root variant="outline">
      <Card.Body>
        <Heading size="sm" mb={3}>
          Participation
        </Heading>
        <VStack align="stretch" gap={2}>
          <Row label="Sum participants" value={sumParticipants.toString()} />
          <Row label="Sum invited" value={sumInvited.toString()} />
          <Row label="Sum declined" value={sumDeclined.toString()} />
          <Row label="Avg participants/quest" value={avg(sumParticipants)} />
          <Row label="Avg invited/quest" value={avg(sumInvited)} />
          <Row label="Avg declined/quest" value={avg(sumDeclined)} />
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}

const PrizeByStatusCard = ({ aggregate }: { aggregate: ChallengesAggregate }) => (
  <Card.Root variant="outline">
    <Card.Body>
      <Heading size="sm" mb={3}>
        Total B3TR (totalPrize) by status
      </Heading>
      <Table.Root size="sm">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>Status</Table.ColumnHeader>
            <Table.ColumnHeader textAlign="end">Count</Table.ColumnHeader>
            <Table.ColumnHeader textAlign="end">Total B3TR</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {STATUS_ORDER.map(s => (
            <Table.Row key={s}>
              <Table.Cell>{challengeStatusLabel(s)}</Table.Cell>
              <Table.Cell textAlign="end">{aggregate.byStatus.get(s) ?? 0}</Table.Cell>
              <Table.Cell textAlign="end">{fmtB3tr(aggregate.totalPrizeByStatus.get(s) ?? 0n)}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Card.Body>
  </Card.Root>
)

const TopCreatorsCard = ({ aggregate }: { aggregate: ChallengesAggregate }) => (
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
        <Table.Root size="sm">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>#</Table.ColumnHeader>
              <Table.ColumnHeader>Address</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="end">Quests</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {aggregate.topCreators.map((c, i) => (
              <Table.Row key={c.address}>
                <Table.Cell>{i + 1}</Table.Cell>
                <Table.Cell fontFamily="mono" textStyle="xs">
                  {humanAddress(c.address)}
                </Table.Cell>
                <Table.Cell textAlign="end">{c.count}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      )}
    </Card.Body>
  </Card.Root>
)

const Row = ({ label, value }: { label: string; value: string }) => (
  <HStack justify="space-between">
    <Text textStyle="sm">{label}</Text>
    <Text textStyle="sm" color="text.subtle">
      {value}
    </Text>
  </HStack>
)
