import { getXAppMetadata, getXAppMetadataQueryKey, useAllocationsRound, useGetVotesOnBlock } from "@/api"
import { getIpfsImage, getIpfsImageQueryKey } from "@/api/ipfs"
import { notFoundImage } from "@/constants"
import { Box, Card, CardBody, HStack, Heading, Icon, Image, Skeleton, Text, VStack } from "@chakra-ui/react"
import { useQueries } from "@tanstack/react-query"
import { useWallet } from "@vechain/dapp-kit-react"
import { FaInfoCircle } from "react-icons/fa"
import BigNumber from "bignumber.js"
import { FormData as UserVotesFormData } from "../AllocationRoundUserVotes"
import { useMemo } from "react"

type Props = {
  roundId: string
  votes: UserVotesFormData["votes"]
}

const compactFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  compactDisplay: "short",
})

export const AppVotesBreakdown = ({ roundId, votes }: Props) => {
  const { account } = useWallet()
  const { data: roundInfo, isLoading: roundInfoLoading } = useAllocationsRound(roundId)
  const { data: votesAtSnapshot, isLoading: votesAtSnapshotLoading } = useGetVotesOnBlock(
    Number(roundInfo.voteStart),
    account ?? undefined,
  )

  const totalVotes = useMemo(() => {
    const rawValue = votes.reduce((acc, vote) => acc + (Number(vote.rawValue) || 0), 0)
    if (rawValue >= 99.99) return 100
    return rawValue
  }, [votes])

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

  const appsMetadata = useQueries({
    queries: votes.map(vote => ({
      queryKey: getXAppMetadataQueryKey(vote.appId),
      queryFn: async () => {
        return await getXAppMetadata(vote.appId)
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
  return (
    <Card variant="filled" w="full">
      <CardBody>
        <VStack w="full" spacing={8}>
          <HStack justify={"space-between"} align="flex-end" w="full">
            <Box>
              <Skeleton isLoaded={!roundInfoLoading && !votesAtSnapshotLoading}>
                <Heading size="2xl">{compactFormatter.format(Number(votesAtSnapshot?.scaled) ?? 0)}</Heading>
              </Skeleton>
              <Text fontSize={"md"} textTransform={"uppercase"}>
                Your Voting Power
              </Text>
            </Box>
            <Text fontSize="sm" fontWeight="medium" color={isOverDistributed ? "orange" : "gray"}>
              {new BigNumber(totalVotes).toFixed(2, BigNumber.ROUND_DOWN)}% distributed
            </Text>
          </HStack>
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
                    <Text fontSize="sm" mt={1}>
                      {vote.value}%
                    </Text>
                  </VStack>
                ) : null,
              )}
            </HStack>
          </VStack>
          <HStack w="full" spacing={2}>
            <Icon as={FaInfoCircle} color="gray" />
            <Text fontSize="sm" color="gray">
              This amount was snapshotted at the moment the proposal was created. If you got more VOT3 after that, you
              will use it on the next proposals.
            </Text>
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  )
}
