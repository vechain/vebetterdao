"use client"

import { Button, Heading, HStack, Icon, Text, VStack } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { LuFileText, LuFlag, LuGavel, LuTriangleAlert, LuVote } from "react-icons/lu"

import { useGetMinorSlashPercentage } from "@/api/contracts/navigatorRegistry/hooks/useGetMinorSlashPercentage"
import { useGetStake } from "@/api/contracts/navigatorRegistry/hooks/useGetStake"
import { useGetTotalDelegatedAtTimepoint } from "@/api/contracts/navigatorRegistry/hooks/useGetTotalDelegatedAtTimepoint"
import { useIsSlashedFor } from "@/api/contracts/navigatorRegistry/hooks/useIsSlashedFor"
import { useNavigatorMinorSlashEventsByRound } from "@/api/contracts/navigatorRegistry/hooks/useNavigatorMinorSlashEvent"
import { useAllocationRoundSnapshot } from "@/api/contracts/xAllocations/hooks/useAllocationRoundSnapshot"
import { BaseModal } from "@/components/BaseModal"
import {
  type InfractionType,
  type ReportableInfraction,
  useReportNavigatorInfraction,
} from "@/hooks/navigator/useReportNavigatorInfraction"
import { useTransactionModal } from "@/providers/TransactionModalProvider"

const formatter = getCompactFormatter(2)

const BASIS_POINTS = 10_000

const INFRACTION_ICON: Record<InfractionType, React.ReactNode> = {
  missedAllocationVote: <LuVote />,
  latePreferences: <LuVote />,
  stalePreferences: <LuVote />,
  missedGovernanceVote: <LuGavel />,
  missedReport: <LuFileText />,
}

type Props = {
  isOpen: boolean
  onClose: () => void
  navigatorAddress: string
  infractions: ReportableInfraction[]
}

export const ReportNavigatorModal = ({ isOpen, onClose, navigatorAddress, infractions }: Props) => {
  const { t } = useTranslation()
  const { isTxModalOpen } = useTransactionModal()
  const { data: stake } = useGetStake(navigatorAddress)
  const { data: slashBps } = useGetMinorSlashPercentage()
  const roundId = infractions[0]?.roundId
  const { data: slashedByRound } = useIsSlashedFor(navigatorAddress, roundId ? [roundId] : [])

  const { sendTransaction } = useReportNavigatorInfraction({
    navigatorAddress,
  })

  const stakeNum = stake ? Number(stake.scaled) : 0
  const penaltyPct = slashBps != null ? slashBps / 100 : 10
  // Pre-slash estimate: % of current stake. Only meaningful before the slash happens.
  const estimatedPenaltyAmount = slashBps != null ? (stakeNum * slashBps) / BASIS_POINTS : 0

  const proposalIds = useMemo(
    () =>
      [
        ...new Set(
          infractions
            .filter(inf => inf.type === "missedGovernanceVote")
            .map(inf => inf.proposalId)
            .filter(Boolean),
        ),
      ] as string[],
    [infractions],
  )

  const { data: snapshotBlock } = useAllocationRoundSnapshot(roundId ?? "")
  const { data: delegatedAtSnapshot } = useGetTotalDelegatedAtTimepoint(navigatorAddress, snapshotBlock ?? undefined)
  const hadDelegations = delegatedAtSnapshot ? delegatedAtSnapshot.raw > 0n : false

  const isReported = roundId ? (slashedByRound?.get(roundId)?.slashed ?? false) : false

  // After the slash, current stake no longer matches pre-slash stake, so the
  // estimate would be ~5% lower than reality. Read the actual amount from the
  // emitted event instead. Falls back to estimate if the event is still loading.
  const { data: slashEventsByRound } = useNavigatorMinorSlashEventsByRound(isReported ? navigatorAddress : undefined)
  const actualPenaltyAmount = roundId ? Number(slashEventsByRound?.get(roundId)?.amount ?? 0) : 0
  const reportedPenaltyAmount = actualPenaltyAmount > 0 ? actualPenaltyAmount : estimatedPenaltyAmount

  const handleReport = useCallback(() => {
    if (!roundId) return
    sendTransaction({ navigator: navigatorAddress, roundId, proposalIds })
  }, [navigatorAddress, proposalIds, roundId, sendTransaction])

  const labelForType = (inf: ReportableInfraction): string => {
    switch (inf.type) {
      case "missedAllocationVote":
        return t("Missed Allocation Vote")
      case "latePreferences":
        return t("Late Preferences")
      case "stalePreferences":
        return t("Stale Preferences")
      case "missedReport":
        return t("Missed Report")
      case "missedGovernanceVote":
        return inf.proposalTitle ?? t("Missed Governance Vote")
    }
  }

  return (
    <BaseModal isOpen={isOpen && !isTxModalOpen} onClose={onClose} ariaTitle={t("Report Navigator")} showCloseButton>
      <VStack gap={4} align="stretch" py={4} px={2}>
        <Heading size="md">{t("Navigator infractions")}</Heading>

        {infractions.length === 0 ? (
          <Text textStyle="sm" color="text.subtle">
            {t("No reportable infractions in the latest completed allocation round.")}
          </Text>
        ) : isReported ? (
          <ReportedInfractionsView
            infractions={infractions}
            labelForType={labelForType}
            penaltyPct={penaltyPct}
            penaltyAmount={reportedPenaltyAmount}
          />
        ) : (
          <PendingInfractionsView
            infractions={infractions}
            labelForType={labelForType}
            penaltyPct={penaltyPct}
            penaltyAmount={estimatedPenaltyAmount}
            hadDelegations={hadDelegations}
            onReport={handleReport}
          />
        )}
      </VStack>
    </BaseModal>
  )
}

type ViewProps = {
  infractions: ReportableInfraction[]
  labelForType: (inf: ReportableInfraction) => string
  penaltyPct: number
  penaltyAmount: number
}

type PendingViewProps = ViewProps & {
  hadDelegations: boolean
  onReport: () => void
}

const PendingInfractionsView = ({
  infractions,
  labelForType,
  penaltyPct,
  penaltyAmount,
  hadDelegations,
  onReport,
}: PendingViewProps) => {
  const { t } = useTranslation()

  return (
    <>
      <HStack gap={2} p={3} borderRadius="lg" bg="status.warning.subtle" align="start">
        <Icon color="status.warning.primary" mt={0.5}>
          <LuTriangleAlert />
        </Icon>
        <VStack gap={0.5} align="start">
          <Text textStyle="sm" fontWeight="semibold">
            {`${t("Penalty per reported round")}: ${penaltyPct}% (${formatter.format(penaltyAmount)} B3TR)`}
          </Text>
          <Text textStyle="xs" color="text.subtle">
            {t("navigatorReportOnChainValidation")}
          </Text>
        </VStack>
      </HStack>

      <VStack gap={2} align="stretch">
        {infractions.map(inf => (
          <HStack
            key={`${inf.type}-${inf.proposalId ?? inf.roundId}`}
            p={3}
            borderRadius="lg"
            border="sm"
            borderColor="border.secondary"
            gap={3}>
            <Icon boxSize={4} color="text.subtle">
              {INFRACTION_ICON[inf.type]}
            </Icon>
            <VStack align="start" gap={0} flex={1}>
              <Text textStyle="sm" fontWeight="medium">
                {labelForType(inf)}
              </Text>
              <Text textStyle="xs" color="text.subtle">
                {t("Round #{{round}}", { round: inf.roundId })}
              </Text>
            </VStack>
          </HStack>
        ))}
      </VStack>

      {hadDelegations ? (
        <Button alignSelf="end" variant="outline" size="sm" colorPalette="red" onClick={onReport}>
          <LuFlag />
          {t("Report")}
        </Button>
      ) : (
        <HStack gap={2} p={3} borderRadius="lg" bg="bg.subtle" align="start">
          <Icon color="text.subtle" mt={0.5}>
            <LuTriangleAlert />
          </Icon>
          <Text textStyle="sm" color="text.subtle">
            {t("This navigator had no active citizens during this round, so the penalty cannot be applied.")}
          </Text>
        </HStack>
      )}
    </>
  )
}

const ReportedInfractionsView = ({ infractions, labelForType, penaltyPct, penaltyAmount }: ViewProps) => {
  const { t } = useTranslation()

  return (
    <>
      <VStack gap={1} align="start" p={3} borderRadius="lg" bg="bg.subtle">
        <Text textStyle="sm" fontWeight="semibold">
          {t("All infractions reported")}
        </Text>
        {penaltyAmount > 0 && (
          <Text textStyle="xs" color="text.subtle">
            {t("This navigator was penalized {{amount}} B3TR ({{pct}}% of stake) for the infractions below.", {
              amount: formatter.format(penaltyAmount),
              pct: penaltyPct,
            })}
          </Text>
        )}
      </VStack>

      <VStack gap={2} align="stretch">
        {infractions.map(inf => (
          <HStack
            key={`${inf.type}-${inf.proposalId ?? inf.roundId}`}
            p={3}
            borderRadius="lg"
            border="sm"
            borderColor="border.secondary"
            gap={3}>
            <Icon boxSize={4} color="text.subtle">
              {INFRACTION_ICON[inf.type]}
            </Icon>
            <VStack align="start" gap={0} flex={1}>
              <Text textStyle="sm" fontWeight="medium">
                {labelForType(inf)}
              </Text>
              <Text textStyle="xs" color="text.subtle">
                {t("Round #{{round}}", { round: inf.roundId })}
              </Text>
            </VStack>
          </HStack>
        ))}
      </VStack>
    </>
  )
}
