import { HStack, Skeleton, Text, Icon, Stat } from "@chakra-ui/react"
import { FormattingUtils } from "@repo/utils"
import { UseQueryResult } from "@tanstack/react-query"
import { useMemo } from "react"
import { Trans, useTranslation } from "react-i18next"
import { FaQuestionCircle } from "react-icons/fa"

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
    <HStack justify="space-between" align="start">
      <Stat.Root size="sm" gap="0">
        <Stat.ValueText fontWeight="bold" textStyle="md">
          <Skeleton loading={votesAtSnapshotQuery.isLoading}>
            {FormattingUtils.humanNumber(votesAtSnapshotQuery.data ?? 0)}
          </Skeleton>
        </Stat.ValueText>
        <Stat.Label textStyle="xs">{t("Votes at snapshot")}</Stat.Label>
      </Stat.Root>

      <Stat.Root size="sm" gap="0">
        <Stat.ValueText fontWeight="bold" textStyle="md">
          <Skeleton loading={userVotesAtSnapshotQuery.isLoading}>
            {FormattingUtils.humanNumber(Number(totalVotesWithDeposits ?? 0))}
          </Skeleton>
        </Stat.ValueText>
        <Stat.Label textStyle="xs">
          {t("Your votes at snapshot")}

          {hasDepositVotingPower && (
            <Tooltip
              content={
                <Trans
                  i18nKey="Includes <bold>{{depositsVotes}} VOT3</bold> from supporting proposals"
                  values={{ depositsVotes: FormattingUtils.humanNumber(Number(depositsVotes ?? 0)) }}
                  components={{ bold: <Text color="fg.inverted" as="span" fontWeight="semibold" /> }}
                />
              }>
              <Icon as={FaQuestionCircle} boxSize="3.5" color="icon.default" />
            </Tooltip>
          )}
        </Stat.Label>
      </Stat.Root>
    </HStack>
  )
}
