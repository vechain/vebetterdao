import { HStack, Image, Skeleton, Text, VStack } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { UseQueryResult } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"

const compactFormatter = getCompactFormatter(2)

type Props = {
  votesAtSnapshotQuery: UseQueryResult<string, Error>
  userVotesAtSnapshotQuery: UseQueryResult<string, Error>
}
export const ProposalSessionVot3 = ({ votesAtSnapshotQuery, userVotesAtSnapshotQuery }: Props) => {
  const { t } = useTranslation()

  return (
    <HStack p="16px" rounded="12px" bg="#FAFAFA" justify={"space-between"}>
      {/* {proposal.state !== ProposalState.Pending && ( */}
      <VStack align="stretch" gap={1}>
        <HStack>
          <Image h="20px" w="20px" src="/images/vot3-token.png" alt="vot3-token" />
          <Skeleton isLoaded={!votesAtSnapshotQuery.isLoading}>
            <Text color="#252525" fontWeight={600}>
              {compactFormatter.format(Number(votesAtSnapshotQuery.data ?? 0))}
            </Text>
          </Skeleton>
        </HStack>
        <Text color="#6A6A6A" fontSize="12px">
          {t("Votes at snapshot")}
        </Text>
      </VStack>
      {/* )} */}
      <VStack align="stretch" gap={1}>
        <HStack>
          <Image h="20px" w="20px" src="/images/vot3-token.png" alt="vot3-token" />
          <Skeleton isLoaded={!userVotesAtSnapshotQuery.isLoading}>
            <Text color="#252525" fontWeight={600}>
              {compactFormatter.format(Number(userVotesAtSnapshotQuery.data ?? 0))}
            </Text>
          </Skeleton>
        </HStack>
        <Text color="#6A6A6A" fontSize="12px">
          {t("Your votes at snapshot")}
        </Text>
      </VStack>
    </HStack>
  )
}
