"use client"

import { Card, Heading, HStack, Icon, IconButton, Separator, Skeleton, Text, VStack } from "@chakra-ui/react"
import { humanAddress, humanDomain } from "@repo/utils/FormattingUtils"
import { useVechainDomain, useWallet } from "@vechain/vechain-kit"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { FiArrowUpRight } from "react-icons/fi"
import { LuCoins, LuFileText, LuGavel, LuShieldAlert, LuTriangleAlert, LuUsers, LuVote } from "react-icons/lu"

import { useGetFeePercentage } from "@/api/contracts/navigatorRegistry/hooks/useGetFeePercentage"
import { useGetMinStake } from "@/api/contracts/navigatorRegistry/hooks/useGetMinStake"
import { useGetNavigator } from "@/api/contracts/navigatorRegistry/hooks/useGetNavigator"
import { useGetStake } from "@/api/contracts/navigatorRegistry/hooks/useGetStake"
import { useIsDelegated } from "@/api/contracts/navigatorRegistry/hooks/useIsDelegated"
import { useNavigatorStatus } from "@/api/contracts/navigatorRegistry/hooks/useNavigatorStatus"
import { useMyDelegationInfo } from "@/api/indexer/navigators/useMyDelegationInfo"
import { useNavigatorByAddress } from "@/api/indexer/navigators/useNavigators"
import { AddressIcon } from "@/components/AddressIcon"

import { NavigatorProposalVoteModal } from "../navigators/[address]/components/modals/NavigatorProposalVoteModal"
import { NavigatorRoundVotesModal } from "../navigators/[address]/components/modals/NavigatorRoundVotesModal"
import { ViewReportModal } from "../navigators/[address]/components/modals/ViewReportModal"
import { TaskRow } from "../navigators/[address]/components/NavigatorRoundHistory/TaskRow"
import {
  type ReportRowStatus,
  type RoundCompliance,
  type RoundVote,
} from "../navigators/[address]/components/NavigatorRoundHistory/types"
import { useRoundsCompliance } from "../navigators/[address]/components/NavigatorRoundHistory/useRoundsCompliance"

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"

export const CitizenNavigatorCard = () => {
  const { account } = useWallet()

  const { data: isDelegated } = useIsDelegated(account?.address)
  const { data: navigatorAddress } = useGetNavigator(account?.address)

  const hasNavigator = isDelegated && navigatorAddress && navigatorAddress !== ZERO_ADDRESS

  if (!account?.address || !hasNavigator) return null

  return <CitizenNavigatorCardContent navigatorAddress={navigatorAddress} />
}

type ContentProps = { navigatorAddress: string }

const CitizenNavigatorCardContent = ({ navigatorAddress }: ContentProps) => {
  const { t } = useTranslation()
  const router = useRouter()

  const { data: nav, isLoading: navLoading } = useNavigatorByAddress(navigatorAddress)
  const { data: domainData } = useVechainDomain(navigatorAddress)
  const { data: status } = useNavigatorStatus(navigatorAddress)
  const { data: delegationInfo } = useMyDelegationInfo(navigatorAddress)
  const { data: fee } = useGetFeePercentage()
  const { data: minStakeData } = useGetMinStake()
  const { data: stakeData } = useGetStake(navigatorAddress)
  const isBelowMinStake = minStakeData && stakeData ? stakeData.raw < minStakeData.raw : false

  const { rounds, roundVotesMap, slashedByRound } = useRoundsCompliance(navigatorAddress)

  const [viewReportURI, setViewReportURI] = useState<string | null>(null)
  const [selectedRoundVote, setSelectedRoundVote] = useState<RoundVote | null>(null)
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null)

  const displayName = domainData?.domain ? humanDomain(domainData.domain, 15, 10) : humanAddress(navigatorAddress, 6, 4)
  const citizens = nav?.citizenCount ?? 0

  const delegatedSince = useMemo(() => {
    if (!delegationInfo?.delegatedAt) return undefined
    return new Date(delegationInfo.delegatedAt * 1000).toLocaleDateString()
  }, [delegationInfo])

  const currentRound = useMemo(() => rounds.find(r => r.isRoundStillOpen) ?? rounds[0], [rounds])

  const wasSlashedRecently = useMemo(() => {
    if (!slashedByRound) return false
    const recentClosed = rounds.filter(r => !r.isRoundStillOpen).slice(0, 2)
    return recentClosed.some(r => slashedByRound.get(r.roundId)?.slashed)
  }, [rounds, slashedByRound])

  return (
    <>
      <Card.Root w="full" variant="primary">
        <Card.Body>
          <VStack gap={4} align="stretch">
            <HStack justify="space-between">
              <Heading size="xl">{t("Your Navigator")}</Heading>
              <IconButton
                rounded="full"
                variant="surface"
                aria-label={t("Go to Navigator")}
                width="6"
                onClick={() => router.push(`/navigators/${navigatorAddress}`)}>
                <FiArrowUpRight />
              </IconButton>
            </HStack>

            <Skeleton loading={navLoading}>
              <HStack gap={3}>
                <AddressIcon address={navigatorAddress} boxSize={10} />
                <VStack align="start" gap={0}>
                  <Text textStyle="md" fontWeight="semibold">
                    {displayName}
                  </Text>
                  <HStack gap={2} flexWrap="wrap">
                    <HStack gap={1}>
                      <Icon boxSize={3} color="text.subtle">
                        <LuUsers />
                      </Icon>
                      <Text textStyle="xs" color="text.subtle">
                        {citizens} {t("citizens")}
                      </Text>
                    </HStack>
                    {fee && (
                      <Text textStyle="xs" color="text.subtle">
                        {t("Fee")}
                        {": "}
                        {fee.percent}
                        {"%"}
                      </Text>
                    )}
                    {delegatedSince && (
                      <Text textStyle="xs" color="text.subtle">
                        {t("Since")} {delegatedSince}
                      </Text>
                    )}
                  </HStack>
                </VStack>
              </HStack>
            </Skeleton>

            {status === "EXITING" && (
              <HStack gap={2} p={2} borderRadius="md" bg="status.warning.subtle">
                <Icon boxSize={4} color="status.warning.primary">
                  <LuTriangleAlert />
                </Icon>
                <Text textStyle="xs" color="status.warning.primary" fontWeight="medium">
                  {t("This navigator has announced exit. You should consider delegating to another navigator.")}
                </Text>
              </HStack>
            )}

            {wasSlashedRecently && (
              <HStack gap={2} p={2} borderRadius="md" bg="status.negative.subtle">
                <Icon boxSize={4} color="status.negative.primary">
                  <LuShieldAlert />
                </Icon>
                <Text textStyle="xs" color="status.negative.primary" fontWeight="medium">
                  {t("This navigator was recently penalized for not fulfilling their duties.")}
                </Text>
              </HStack>
            )}

            {isBelowMinStake && (
              <HStack gap={2} p={2} borderRadius="md" bg="status.warning.subtle">
                <Icon boxSize={4} color="status.warning.primary">
                  <LuCoins />
                </Icon>
                <Text textStyle="xs" color="status.warning.primary" fontWeight="medium">
                  {t(
                    "Your navigator's stake is below the minimum required. They may be penalized if it's not resolved.",
                  )}
                </Text>
              </HStack>
            )}

            {currentRound && (
              <>
                <Separator />
                <CurrentRoundTasks
                  round={currentRound}
                  roundVote={roundVotesMap.get(currentRound.roundId) ?? null}
                  navigatorAddress={navigatorAddress}
                  onViewReport={setViewReportURI}
                  onSelectAllocationVote={setSelectedRoundVote}
                  onSelectProposal={setSelectedProposalId}
                />
              </>
            )}
          </VStack>
        </Card.Body>
      </Card.Root>

      <ViewReportModal isOpen={!!viewReportURI} onClose={() => setViewReportURI(null)} reportURI={viewReportURI} />
      <NavigatorRoundVotesModal
        isOpen={!!selectedRoundVote}
        onClose={() => setSelectedRoundVote(null)}
        round={selectedRoundVote}
      />
      <NavigatorProposalVoteModal
        isOpen={!!selectedProposalId}
        onClose={() => setSelectedProposalId(null)}
        proposalId={selectedProposalId ?? ""}
        navigatorAddress={navigatorAddress}
      />
    </>
  )
}

type CurrentRoundTasksProps = {
  round: RoundCompliance
  roundVote: RoundVote | null
  navigatorAddress: string
  onViewReport: (uri: string) => void
  onSelectAllocationVote: (rv: RoundVote) => void
  onSelectProposal: (proposalId: string) => void
}

const CurrentRoundTasks = ({
  round,
  roundVote,
  onViewReport,
  onSelectAllocationVote,
  onSelectProposal,
}: CurrentRoundTasksProps) => {
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
    <VStack gap={1} align="stretch">
      <Text textStyle="xs" fontWeight="semibold" color="text.subtle">
        {t("Round #{{round}}", { round: round.roundId })}
      </Text>

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
  )
}
