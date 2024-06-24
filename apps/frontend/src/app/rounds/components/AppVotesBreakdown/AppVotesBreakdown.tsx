import { getXAppMetadata, getXAppMetadataQueryKey, useXApps } from "@/api"
import { getIpfsImage, getIpfsImageQueryKey } from "@/api/ipfs"
import { notFoundImage } from "@/constants"
import { Box, Flex, HStack, Image, Skeleton, Spinner, Text, VStack } from "@chakra-ui/react"
import { useQueries } from "@tanstack/react-query"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import BigNumber from "bignumber.js"

export type AppVotesBreakdownProps = {
  votes: {
    appId: string
    value: string
    rawValue: number
  }[]
  isLoading?: boolean
  minPercentageToNotMerge?: number
}

/**
 * This component displays the votes breakdown for the apps.
 * It shows the percentage of votes allocated to each app.
 * @param votes The votes data
 * @param isLoading Whether the data is loading
 * @param minPercentageToNotMerge The minimum percentage to not merge the app into "Rest" - default is 15
 */
export const AppVotesBreakdown = ({ votes, isLoading, minPercentageToNotMerge = 15 }: AppVotesBreakdownProps) => {
  const { t } = useTranslation()
  const { data: x2EarnApps } = useXApps()
  const totalVotes = (() => {
    const rawValue = votes.reduce((acc, vote) => acc + (Number(vote.rawValue) || 0), 0)
    if (rawValue >= 99.99 && rawValue < 100) return 100
    return rawValue
  })()
  const isCompletedAllocated = totalVotes >= 100

  const isOverDistributed = totalVotes > 100

  const getLinesColor = (index: number) => {
    if (isOverDistributed) return `orange.${index + 1}00`
    return `green.${index + 1}00`
  }

  const getLineWidth = (voteValue: number) => {
    if (isOverDistributed) return (voteValue / totalVotes) * 100
    return voteValue
  }

  const votedX2EarnApps = useMemo(() => {
    if (!votes || !x2EarnApps) return []

    return x2EarnApps.filter(app => votes.some(vote => vote.appId === app.id))
  }, [x2EarnApps, votes])

  const appsMetadata = useQueries({
    queries: votedX2EarnApps.map(app => ({
      queryKey: getXAppMetadataQueryKey(app.metadataURI),
      queryFn: async () => {
        return await getXAppMetadata(app.metadataURI)
      },
    })),
  })

  const logos = useQueries({
    queries: appsMetadata.map(metadata => ({
      queryKey: getIpfsImageQueryKey(metadata.data?.logo),
      queryFn: async () => {
        return await getIpfsImage(metadata.data?.logo)
      },
      enabled: !!metadata.data?.logo,
    })),
  })

  // sort the votes, merge the rest of the votes into one if there are more than maxApps
  const parsedVotes: ((typeof votes)[0] & {
    isRest?: boolean
    restNumber?: number
  })[] = useMemo(() => {
    const selectedVotes = votes.filter(vote => Number(vote.value) > 0)
    const appsToMerge = selectedVotes.filter(vote => Number(vote.value) < minPercentageToNotMerge)

    if (appsToMerge.length > 1) {
      const notMergedVotes = selectedVotes.filter(vote => Number(vote.value) >= minPercentageToNotMerge)
      const mergedVotesValue = appsToMerge.reduce((acc, vote) => acc + vote.rawValue, 0)
      const restVote = {
        appId: "rest",
        isRest: true,
        restNumber: appsToMerge.length,
        value: new BigNumber(mergedVotesValue).toFixed(2, BigNumber.ROUND_HALF_DOWN),
        rawValue: mergedVotesValue,
      }
      return [...notMergedVotes, restVote]
    }
    return selectedVotes
  }, [votes, minPercentageToNotMerge])

  if (isLoading) return <Spinner />
  return (
    <VStack w="full" h={24} spacing={0}>
      <HStack w="full" borderRadius={"50px"} bg="#D5D5D5" h={"16px"} spacing={0}>
        {parsedVotes.map((vote, index) => (
          <Box
            transition={"all 0.5s linear"}
            {...((index === 0 || totalVotes === Number(vote.value)) && { borderLeftRadius: "50px" })}
            {...((index === parsedVotes.length - 1 || Number(vote.value) === totalVotes) &&
              isCompletedAllocated && { borderRightRadius: "50px" })}
            key={`${vote.appId}-track`}
            w={`${getLineWidth(Number(vote.value))}%`}
            bg={getLinesColor(index)}
            h="full"
          />
        ))}
      </HStack>
      <HStack w="full" h={"full"}>
        {parsedVotes.map((vote, index) =>
          Number(vote.value) > 0 ? (
            <VStack
              key={`${vote.appId}-line`}
              w={`${getLineWidth(Number(vote.value))}%`}
              h={"full"}
              spacing={0}
              align="center">
              <Box w="3px" h={"full"} bg={getLinesColor(index)} />
              <Skeleton isLoaded={!logos[index]?.isLoading}>
                {vote.isRest ? (
                  <Flex boxSize={"32px"} borderRadius="9px" bg="gray.100" justify={"center"} align={"center"}>
                    <Text fontSize="16px" fontWeight={600} data-testid="app-rest-vote">
                      {t("+{{value}}", { value: vote.restNumber })}
                    </Text>
                  </Flex>
                ) : (
                  <Image
                    src={logos[index]?.data?.image ?? notFoundImage}
                    alt={appsMetadata[index]?.data?.name}
                    boxSize={"32px"}
                    borderRadius="9px"
                  />
                )}
              </Skeleton>
              <Text fontSize="sm" mt={1} data-testid={`app-${vote.appId}-vote-${vote.value}`}>
                {t("{{percentage}}%", { percentage: vote.value })}
              </Text>
            </VStack>
          ) : null,
        )}
      </HStack>
    </VStack>
  )
}
