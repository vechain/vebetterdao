import { getXAppMetadata, getXAppMetadataQueryKey, useXApps } from "@/api"
import { getIpfsImage, getIpfsImageQueryKey } from "@/api/ipfs"
import { notFoundImage } from "@/constants"
import { Box, HStack, Image, Skeleton, Spinner, Text, VStack } from "@chakra-ui/react"
import { useQueries } from "@tanstack/react-query"
import { useMemo } from "react"

export type AppVotesBreakdownProps = {
  votes: {
    appId: string
    value: string
    rawValue: number
  }[]
  isLoading?: boolean
}

export const AppVotesBreakdown = ({ votes, isLoading }: AppVotesBreakdownProps) => {
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

  const selectedVotes = votes.filter(vote => Number(vote.value) > 0)

  if (isLoading) return <Spinner />
  return (
    <VStack w="full" h={24} spacing={0}>
      <HStack w="full" borderRadius={"xl"} bg="gray" h={5} spacing={0}>
        {selectedVotes.map((vote, index) => (
          <Box
            transition={"all 0.5s linear"}
            {...((index === 0 || totalVotes === Number(vote.value)) && { borderLeftRadius: "xl" })}
            {...((index === selectedVotes.length - 1 || Number(vote.value) === totalVotes) &&
              isCompletedAllocated && { borderRightRadius: "xl" })}
            key={`${vote.appId}-track`}
            w={`${getLineWidth(Number(vote.value))}%`}
            bg={getLinesColor(index)}
            h="full"
          />
        ))}
      </HStack>
      <HStack w="full" h={"full"}>
        {votes.map((vote, index) =>
          Number(vote.value) > 0 ? (
            <VStack
              key={`${vote.appId}-line`}
              w={`${getLineWidth(Number(vote.value))}%`}
              h={"full"}
              spacing={0}
              align="center">
              <Box w="3px" h={"full"} bg={getLinesColor(index)} />
              <Skeleton isLoaded={!logos[index]?.isLoading}>
                <Image
                  src={logos[index]?.data?.image ?? notFoundImage}
                  alt={appsMetadata[index]?.data?.name}
                  boxSize={[6, 6, 8]}
                  borderRadius="9px"
                />
              </Skeleton>
              <Text fontSize="sm" mt={1} data-testid={`app-${vote.appId}-vote-${vote.value}`}>
                {vote.value}%
              </Text>
            </VStack>
          ) : null,
        )}
      </HStack>
    </VStack>
  )
}
