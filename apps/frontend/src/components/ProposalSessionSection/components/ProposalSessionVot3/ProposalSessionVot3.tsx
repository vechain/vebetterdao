import { HStack, Skeleton, Text, VStack } from "@chakra-ui/react"
import { FormattingUtils } from "@repo/utils"
import { UseQueryResult } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"

type Props = {
  votesAtSnapshotQuery: UseQueryResult<string, unknown>
  userVotesAtSnapshotQuery: UseQueryResult<string, unknown>
}
export const ProposalSessionVot3 = ({ votesAtSnapshotQuery, userVotesAtSnapshotQuery }: Props) => {
  const { t } = useTranslation()

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
          <Text fontWeight={600}>{FormattingUtils.humanNumber(userVotesAtSnapshotQuery.data ?? 0)}</Text>
        </Skeleton>
        <Text color="#6A6A6A" fontSize="12px">
          {t("Your votes at snapshot")}
        </Text>
      </VStack>
    </HStack>
  )
}
