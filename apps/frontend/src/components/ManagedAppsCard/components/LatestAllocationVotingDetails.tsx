import { HStack, Skeleton, Stat } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { useAllocationVoters } from "@/api/contracts/xAllocations/hooks/useAllocationVoters"
import { useAllocationVotes } from "@/api/contracts/xAllocations/hooks/useAllocationVotes"
import { usePreviousAllocationRoundId } from "@/api/contracts/xAllocations/hooks/usePreviousAllocationRoundId"

const compactFormatter = getCompactFormatter(2)

const getPercentageChange = (current: number, previous: number) =>
  previous === 0 ? 0 : ((current - previous) / previous) * 100

export const LatestAllocationVotingDetails = ({ appId: _appId }: { appId: string }) => {
  const { t } = useTranslation()
  const { data: previousRoundId } = usePreviousAllocationRoundId()

  const secondPreviousRoundId = useMemo(() => {
    if (!previousRoundId || Number(previousRoundId) <= 1) return undefined
    return (Number(previousRoundId) - 1).toString()
  }, [previousRoundId])

  const { data: voters, isLoading: votersLoading } = useAllocationVoters(previousRoundId)
  const { data: votes, isLoading: votesLoading } = useAllocationVotes(previousRoundId)
  const { data: prevVotes } = useAllocationVotes(secondPreviousRoundId)

  const votersCount = Number(voters ?? 0)
  const votesCount = Number(votes ?? 0)
  const votesChange = getPercentageChange(votesCount, Number(prevVotes ?? 0))

  const isLoading = votersLoading || votesLoading

  return (
    <Skeleton loading={isLoading} w="full">
      <HStack gap={6} w="full">
        <Stat.Root flex={1}>
          <Stat.Label>{t("Voters")}</Stat.Label>
          <HStack alignItems="center" justifyContent="space-between">
            <Stat.ValueText textStyle="md">
              {compactFormatter.format(votersCount)}{" "}
              {`(${compactFormatter.format(votesCount)} ${t("Votes").toLowerCase()})`}
            </Stat.ValueText>
            <Stat.HelpText color={votesChange >= 0 ? "status.positive.primary" : "status.negative.primary"}>
              {votesChange >= 0 ? "+" : ""}
              {compactFormatter.format(votesChange)}
              {"% than "} <br />
              {t("previous round")}
            </Stat.HelpText>
          </HStack>
        </Stat.Root>
      </HStack>
    </Skeleton>
  )
}
