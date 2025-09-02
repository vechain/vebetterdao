import { Box, HStack, Image, Skeleton, Text, VStack } from "@chakra-ui/react"
import { UilTimes, UilCheck } from "@iconscout/react-unicons"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { UseQueryResult } from "@tanstack/react-query"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

const compactFormatter = getCompactFormatter(2)

const getSafePercentage = (value: number) => {
  return isNaN(value) ? 0 : Math.min(Math.max(value, 0), 100)
}

type Props = {
  quorumQuery: UseQueryResult<string, unknown>
  currentVotesQuery: UseQueryResult<string, unknown>
  isEnded: boolean
  showQuorumNeeded?: boolean
}
export const ProposalQuorumStatus = ({ quorumQuery, currentVotesQuery, isEnded, showQuorumNeeded = true }: Props) => {
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
    return (Number(currentVotesQuery.data) / Number(quorumQuery.data)) * 100
  }, [quorumQuery.data, currentVotesQuery.data])

  const stateColor = useMemo(() => {
    if (isQuorumReached) return "#38BF66"

    if (isEnded) return "#D23F63"
    return "#004CFC"
  }, [isQuorumReached, isEnded])

  const isEndedAndQuorumNotReached = isEnded && !isQuorumReached

  return (
    <VStack align="stretch">
      <Text color="text.subtle" textStyle="sm">
        {t("VOT3 used to vote")}
      </Text>
      <HStack justify={"space-between"} align={"baseline"}>
        <HStack gap={2}>
          <Image h="20px" w="20px" src="/assets/tokens/vot3-token.webp" alt="vot3-token" />
          <Skeleton loading={currentVotesQuery.isLoading || quorumQuery.isLoading}>
            <Text textStyle="2xl" fontWeight="bold" data-testid={"total-votes"}>
              {compactFormatter.format(Number(currentVotesQuery.data ?? 0))}
            </Text>
          </Skeleton>
        </HStack>
        <Skeleton loading={quorumQuery.isLoading || currentVotesQuery.isLoading}>
          <HStack gap={1} align="center">
            {isEndedAndQuorumNotReached && <UilTimes size="16px" color={stateColor} />}
            {isQuorumReached && <UilCheck size="16px" color={stateColor} />}
            <Text fontWeight="semibold" textStyle="sm" color={stateColor}>
              {compactFormatter.format(Number(votesToQuorumPercentage))}
              {t("%")}
            </Text>
          </HStack>
        </Skeleton>
      </HStack>
      <Box position="relative">
        <Skeleton loading={quorumQuery.isLoading || currentVotesQuery.isLoading}>
          <Box bg="#D5D5D5" h="8px" rounded="full" />
          <Box
            bg={stateColor}
            h="8px"
            rounded="full"
            w={`${Number(getSafePercentage(votesToQuorumPercentage))}%`}
            position="absolute"
            top={0}
            left={0}
          />
        </Skeleton>
      </Box>
      {showQuorumNeeded ? (
        <HStack>
          <Skeleton loading={quorumQuery.isLoading}>
            <Text fontWeight="semibold" textStyle="sm">
              {`${compactFormatter.format(Number(quorumQuery.data ?? 0))} VOT3`}
            </Text>
          </Skeleton>
          <Text color="text.subtle" textStyle="sm">
            {t("needed for quorum")}
          </Text>
        </HStack>
      ) : null}
    </VStack>
  )
}
