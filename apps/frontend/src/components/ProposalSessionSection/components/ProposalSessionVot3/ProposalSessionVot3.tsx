import { HStack, Skeleton, Text, VStack } from "@chakra-ui/react"
import { FormattingUtils } from "@repo/utils"
import { UseQueryResult } from "@tanstack/react-query"
import { useMemo } from "react"
import { Trans, useTranslation } from "react-i18next"

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
    if (!data || typeof data === "string") return undefined
    return data.totalVotesWithDeposits
  }, [userVotesAtSnapshotQuery.data])

  const depositsVotes = useMemo(() => {
    const data = userVotesAtSnapshotQuery.data
    if (!data || typeof data === "string") return undefined
    return data.depositsVotes
  }, [userVotesAtSnapshotQuery.data])

  return (
    <HStack p="16px" rounded="12px" bg="light-contrast-on-card-bg" justify={"space-between"}>
      <VStack align="stretch" gap={1} flex={1}>
        <Skeleton isLoaded={!votesAtSnapshotQuery.isLoading}>
          <Text fontWeight={600}>{FormattingUtils.humanNumber(votesAtSnapshotQuery.data ?? 0)}</Text>
        </Skeleton>

        <Text color="#6A6A6A" fontSize="12px">
          {t("Votes at snapshot")}
        </Text>
      </VStack>
      <VStack align="stretch" gap={1} flex={1}>
        <Skeleton isLoaded={!userVotesAtSnapshotQuery.isLoading}>
          <Text fontWeight={600}>{FormattingUtils.humanNumber(Number(totalVotesWithDeposits ?? 0))}</Text>
        </Skeleton>
        <Text color="#6A6A6A" fontSize="12px">
          {t("Your votes at snapshot")}
          {hasDepositVotingPower && (
            <Text fontSize="12px" color="#6A6A6A">
              <Trans
                i18nKey="Includes <bold>{{depositsVotes}} VOT3</bold> from supporting proposals"
                values={{ depositsVotes: FormattingUtils.humanNumber(Number(depositsVotes ?? 0)) }}
                components={{ bold: <Text as="span" fontWeight={"600"} /> }}
              />
            </Text>
          )}
        </Text>
      </VStack>
    </HStack>
  )
}
