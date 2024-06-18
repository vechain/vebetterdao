import { Box, HStack, Image, Skeleton, Text, VStack } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { UseQueryResult } from "@tanstack/react-query"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

const compactFormatter = getCompactFormatter(2)

type Props = {
  quorumQuery: UseQueryResult<string, Error>
  currentVotesQuery: UseQueryResult<string, Error>
  isEnded: boolean
}
export const ProposalQuorumStatus = ({ quorumQuery, currentVotesQuery, isEnded }: Props) => {
  const { t } = useTranslation()

  const isQuorumReached = useMemo(() => {
    if (quorumQuery.data === undefined || currentVotesQuery.data === undefined) {
      return false
    }
    return Number(currentVotesQuery.data) >= Number(quorumQuery.data)
  }, [quorumQuery.data, currentVotesQuery.data])

  const votesToQuorumPercentage = useMemo(() => {
    if (quorumQuery.data === undefined || currentVotesQuery.data === undefined) {
      return 0
    }
    return Number(currentVotesQuery.data) / Number(quorumQuery.data)
  }, [quorumQuery.data, currentVotesQuery.data])

  const stateColor = useMemo(() => {
    if (isQuorumReached) return "#38BF66"

    if (isEnded) return "#D23F63"
    return "#004CFC"
  }, [isQuorumReached, isEnded])

  return (
    <VStack align="stretch">
      <Text color="#6A6A6A" fontWeight={400} fontSize={"14px"}>
        {t("Quorum status")}
      </Text>
      <HStack justify={"space-between"} align={"baseline"}>
        <HStack gap={2}>
          <Image h="20px" w="20px" src="/images/vot3-token.png" alt="vot3-token" />
          <Skeleton isLoaded={!currentVotesQuery.isLoading}>
            <Text fontSize="24px" fontWeight={700}>
              {compactFormatter.format(Number(currentVotesQuery.data ?? 0))}
            </Text>
          </Skeleton>
        </HStack>
        <Skeleton isLoaded={!quorumQuery.isLoading && !currentVotesQuery.isLoading}>
          <Text fontWeight={400} fontSize={"14px"} color={stateColor}>
            {compactFormatter.format(Number(votesToQuorumPercentage * 100))}
            {t("%")}
          </Text>
        </Skeleton>
      </HStack>
      <Box position="relative">
        <Box bg="#D5D5D5" h="8px" rounded="full" />
        <Box
          bg={stateColor}
          h="8px"
          rounded="full"
          w={`${Number(votesToQuorumPercentage)}%`}
          position="absolute"
          top={0}
          left={0}
        />
      </Box>
      <HStack>
        <Skeleton isLoaded={!quorumQuery.isLoading}>
          <Text color="#252525" fontWeight={600} fontSize={"14px"}>
            {`${compactFormatter.format(Number(quorumQuery.data ?? 0))} VOT3`}
          </Text>
        </Skeleton>
        <Text color="#6A6A6A" fontWeight={400} fontSize={"14px"}>
          {t("needed for quorum")}
        </Text>
      </HStack>
    </VStack>
  )
}
