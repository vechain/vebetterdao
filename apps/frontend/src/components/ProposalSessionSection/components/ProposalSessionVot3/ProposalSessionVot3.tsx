import { HStack, Skeleton, Text, VStack, Icon } from "@chakra-ui/react"
import { FaQuestionCircle } from "react-icons/fa"
import { FormattingUtils } from "@repo/utils"
import { UseQueryResult } from "@tanstack/react-query"
import { useMemo } from "react"
import { Trans, useTranslation } from "react-i18next"
import { Tooltip } from "@/components/ui/tooltip"

type Props = {
  votesAtSnapshotQuery: UseQueryResult<string, unknown>
  userVotesAtSnapshotQuery: UseQueryResult<
    | {
        totalVotesWithDeposits: string // total votes
        depositsVotes: string // deposit votes if any
      }
    | string,
    unknown
  >
}

export const ProposalSessionVot3 = ({ votesAtSnapshotQuery, userVotesAtSnapshotQuery }: Props) => {
  const { t } = useTranslation()

  const hasDepositVotingPower = useMemo(() => {
    const data = userVotesAtSnapshotQuery.data
    if (!data || typeof data === "string") return false
    return data.depositsVotes !== "0"
  }, [userVotesAtSnapshotQuery.data])

  const totalVotesWithDeposits = useMemo(() => {
    const data = userVotesAtSnapshotQuery.data
    if (!data || typeof data === "string") return "0"
    return data.totalVotesWithDeposits
  }, [userVotesAtSnapshotQuery.data])

  const depositsVotes = useMemo(() => {
    const data = userVotesAtSnapshotQuery.data
    if (!data || typeof data === "string") return "0"
    return data.depositsVotes
  }, [userVotesAtSnapshotQuery.data])

  return (
    <HStack p="16px" rounded="12px" bg="light-contrast-on-card-bg" justify="space-between" align="start">
      {/* Left: votes at snapshot */}
      <VStack align="stretch" gap={1} flex={1}>
        <Skeleton loading={votesAtSnapshotQuery.isLoading}>
          <Text fontWeight={700}>{FormattingUtils.humanNumber(votesAtSnapshotQuery.data ?? 0)}</Text>
        </Skeleton>
        <Text color="#6A6A6A" fontSize="12px">
          {t("Votes at snapshot")}
        </Text>
      </VStack>

      <VStack align="stretch" gap={1} flex={1}>
        <Skeleton loading={userVotesAtSnapshotQuery.isLoading}>
          <Text fontWeight={700}>{FormattingUtils.humanNumber(Number(totalVotesWithDeposits ?? 0))}</Text>
        </Skeleton>

        <HStack gap={1} align="center">
          <Text color="#6A6A6A" fontSize="12px">
            {t("Your votes at snapshot")}
          </Text>

          {hasDepositVotingPower && (
            <Tooltip
              content={
                <Text>
                  <Trans
                    i18nKey="Includes <bold>{{depositsVotes}} VOT3</bold> from supporting proposals"
                    values={{ depositsVotes: FormattingUtils.humanNumber(Number(depositsVotes ?? 0)) }}
                    components={{ bold: <Text as="span" fontWeight={600} /> }}
                  />
                </Text>
              }>
              <span>
                <Icon as={FaQuestionCircle} boxSize="3.5" color="#A0A0A0" />
              </span>
            </Tooltip>
          )}
        </HStack>
      </VStack>
    </HStack>
  )
}
