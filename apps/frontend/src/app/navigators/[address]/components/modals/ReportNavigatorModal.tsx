"use client"

import { Badge, Button, Heading, HStack, Icon, Text, VStack } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { LuCheck, LuFileText, LuFlag, LuGavel, LuTriangleAlert, LuVote } from "react-icons/lu"

import { useGetMinorSlashPercentage } from "@/api/contracts/navigatorRegistry/hooks/useGetMinorSlashPercentage"
import { useGetStake } from "@/api/contracts/navigatorRegistry/hooks/useGetStake"
import { useIsSlashedFor } from "@/api/contracts/navigatorRegistry/hooks/useIsSlashedFor"
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
  const penaltyAmount = slashBps != null ? (stakeNum * slashBps) / BASIS_POINTS : 0

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

  const isReported = roundId ? (slashedByRound?.get(roundId)?.slashed ?? false) : false

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

  const allReported = isReported

  return (
    <BaseModal isOpen={isOpen && !isTxModalOpen} onClose={onClose} ariaTitle={t("Report Navigator")} showCloseButton>
      <VStack gap={4} align="stretch" py={4} px={2}>
        <Heading size="md">{t("Report Navigator")}</Heading>

        {infractions.length === 0 ? (
          <Text textStyle="sm" color="text.subtle">
            {t("No reportable infractions in the latest completed allocation round.")}
          </Text>
        ) : (
          <>
            <HStack
              gap={2}
              p={3}
              borderRadius="lg"
              bg={allReported ? "status.positive.subtle" : "status.warning.subtle"}
              align="start">
              <Icon color={allReported ? "status.positive.primary" : "status.warning.primary"} mt={0.5}>
                {allReported ? <LuCheck /> : <LuTriangleAlert />}
              </Icon>
              <VStack gap={0.5} align="start">
                <Text textStyle="sm" fontWeight="semibold">
                  {allReported
                    ? t("All infractions reported")
                    : `${t("Penalty per reported round")}: ${penaltyPct}% (${formatter.format(penaltyAmount)} B3TR)`}
                </Text>
                {!allReported && (
                  <Text textStyle="xs" color="text.subtle">
                    {t("navigatorReportOnChainValidation")}
                  </Text>
                )}
              </VStack>
            </HStack>

            <VStack gap={2} align="stretch">
              {infractions.map(inf => {
                return (
                  <HStack
                    key={`${inf.type}-${inf.proposalId ?? inf.roundId}`}
                    p={3}
                    borderRadius="lg"
                    border="sm"
                    borderColor={isReported ? "status.positive.subtle" : "border.secondary"}
                    bg={isReported ? "status.positive.subtle" : undefined}
                    gap={3}>
                    <Icon boxSize={4} color={isReported ? "status.positive.primary" : "text.subtle"}>
                      {isReported ? <LuCheck /> : INFRACTION_ICON[inf.type]}
                    </Icon>
                    <VStack align="start" gap={0} flex={1}>
                      <Text textStyle="sm" fontWeight="medium">
                        {labelForType(inf)}
                      </Text>
                      <Text textStyle="xs" color="text.subtle">
                        {t("Round #{{round}}", { round: inf.roundId })}
                      </Text>
                    </VStack>
                    {isReported && (
                      <Badge colorPalette="green" size="sm">
                        {t("Reported")}
                      </Badge>
                    )}
                  </HStack>
                )
              })}
            </VStack>
            {!isReported && (
              <Button alignSelf="end" variant="outline" size="sm" colorPalette="red" onClick={handleReport}>
                <LuFlag />
                {t("Report")}
              </Button>
            )}
          </>
        )}
      </VStack>
    </BaseModal>
  )
}
