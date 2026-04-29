"use client"

import { Badge, Button, Card, HStack, Icon, Text, VStack } from "@chakra-ui/react"
import { UilArrowUpRight } from "@iconscout/react-unicons"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useTranslation } from "react-i18next"
import { LuFileText, LuFlag, LuGavel, LuShieldAlert, LuVote } from "react-icons/lu"

import { TaskRow } from "./TaskRow"
import { type ReportRowStatus, type RoundCompliance, type RoundVote } from "./types"

const formatter = getCompactFormatter(2)

type RoundCardProps = {
  round: RoundCompliance
  roundVote: RoundVote | null
  onViewReport: (uri: string) => void
  onSelectAllocationVote: (rv: RoundVote) => void
  onSelectProposal: (proposalId: string) => void
  showReportBtn: boolean
  slashed: boolean
  penaltyAmount: number
  onOpenReport: () => void
}

export const RoundCard = ({
  round,
  roundVote,
  onViewReport,
  onSelectAllocationVote,
  onSelectProposal,
  showReportBtn,
  slashed,
  penaltyAmount,
  onOpenReport,
}: RoundCardProps) => {
  const { t } = useTranslation()

  const reportStatus: ReportRowStatus = round.reportSubmitted
    ? "done"
    : round.isRoundStillOpen
      ? round.reportDue
        ? "pending"
        : "optionalOpen"
      : round.reportDue
        ? "missed"
        : "notDue"

  const allocationLabel = {
    done: t("Cast round vote"),
    late: t("Cast round vote late"),
    missed: t("Did not cast round vote"),
    pending: t("Needs to cast round vote"),
  }[round.allocationStatus]

  const reportLabel = {
    done: t("Uploaded report"),
    missed: t("Did not upload report"),
    pending: t("Needs to upload report"),
    late: t("Needs to upload report"),
    notDue: t("Report not required"),
    optionalOpen: t("Report optional"),
  }[reportStatus]

  const canClickAllocation = round.allocationStatus === "done" || round.allocationStatus === "late"
  const canClickReport = round.reportSubmitted && !!round.reportURI

  return (
    <Card.Root variant="outline" borderRadius="xl" h="full">
      <Card.Body>
        <VStack gap={2} align="stretch" h="full">
          <HStack gap={2}>
            <Text textStyle="sm" fontWeight="semibold">
              {t("Round #{{round}}", { round: round.roundId })}
            </Text>
            {round.isRoundStillOpen && (
              <Badge colorPalette="blue" size="xs">
                {t("Ongoing")}
              </Badge>
            )}
          </HStack>

          <VStack gap={1} align="stretch" flex={1}>
            <TaskRow
              icon={<LuVote />}
              label={allocationLabel}
              status={round.allocationStatus}
              onClick={canClickAllocation && roundVote ? () => onSelectAllocationVote(roundVote) : undefined}
            />

            {round.proposals.map((p, i) => {
              const proposalLabel = {
                done: t("Voted in proposal #{{number}}", { number: i + 1 }),
                missed: t("Did not vote in proposal #{{number}}", { number: i + 1 }),
                pending: t("Needs to vote in proposal #{{number}}", { number: i + 1 }),
                late: t("Voted in proposal #{{number}}", { number: i + 1 }),
              }[p.status]

              return (
                <TaskRow
                  key={p.proposalId}
                  icon={<LuGavel />}
                  label={proposalLabel}
                  status={p.status}
                  onClick={p.status === "done" ? () => onSelectProposal(p.proposalId) : undefined}
                />
              )
            })}

            <TaskRow
              icon={<LuFileText />}
              label={reportLabel}
              status={reportStatus}
              onClick={canClickReport ? () => onViewReport(round.reportURI!) : undefined}
            />
          </VStack>

          {showReportBtn && slashed && (
            <HStack
              gap={2}
              p={2}
              borderRadius="md"
              bg="status.negative.subtle"
              cursor="pointer"
              _hover={{ opacity: 0.8 }}
              onClick={onOpenReport}>
              <Icon boxSize={4} color="status.negative.primary">
                <LuShieldAlert />
              </Icon>
              <Text textStyle="xs" color="status.negative.primary" fontWeight="medium" flex={1}>
                {t("Slashed {{amount}} B3TR", { amount: formatter.format(penaltyAmount) })}
              </Text>
              <Icon boxSize="14px" color="status.negative.primary">
                <UilArrowUpRight />
              </Icon>
            </HStack>
          )}
          {showReportBtn && !slashed && (
            <HStack justify="flex-end" pt={1}>
              <Button variant="outline" size="xs" w="full" colorPalette="red" onClick={onOpenReport}>
                <LuFlag />
                {t("Report infractions")}
              </Button>
            </HStack>
          )}
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}
