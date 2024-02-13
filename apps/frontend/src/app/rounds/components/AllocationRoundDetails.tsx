import { useAllocationAmount, useAllocationVoters, useAllocationsRound, useXApps } from "@/api"
import {
  Box,
  Card,
  CardBody,
  HStack,
  Heading,
  Skeleton,
  Stack,
  Text,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react"
import { useMemo } from "react"

type Props = {
  roundId: string
}

const compactFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  compactDisplay: "short",
})

export const AllocationRoundDetails = ({ roundId }: Props) => {
  const { data, isLoading } = useAllocationsRound(roundId)
  const { data: xApps, isLoading: xAppsLoading } = useXApps()
  const { data: totalVoters, isLoading: totalVotersLoading } = useAllocationVoters(roundId)
  const { data: roundAmount, isLoading: roundAmountLoading, error: roundAmountError } = useAllocationAmount(roundId)

  const totalAmount = useMemo(() => {
    if (!roundAmount) return 0
    return BigInt(roundAmount.treasury) + BigInt(roundAmount.voteX2Earn) + BigInt(roundAmount.voteXAllocations)
  }, [roundAmount])

  const bgColor = useColorModeValue("primary.500", "primary.300")

  return (
    <Card w="full">
      <CardBody>
        <Stack direction={["column", "row"]} justify="space-between" spacing={[12, 12, 40]}>
          <VStack spacing={4} align="flex-start" flex={1}>
            <Skeleton isLoaded={!isLoading}>
              <HStack spacing={1} align={"center"}>
                <Heading size="md" color={bgColor}>
                  {data?.voteEndTimestamp?.fromNow(true)} left
                </Heading>
              </HStack>
            </Skeleton>
            <Skeleton isLoaded={!isLoading}>
              <Heading size="xl">Allocations | Round #{data?.proposalId}</Heading>
            </Skeleton>
            <Skeleton isLoaded={!isLoading}>
              <Text color="gray.500">
                {
                  "Vote for your preferred dApps to get more B3TR distribution. This allocation process will repeat every two weeks."
                }
              </Text>
            </Skeleton>
          </VStack>
          <VStack flex={0.8}>
            <VStack
              color={"white"}
              bgColor={bgColor}
              py={6}
              px={6}
              w="full"
              h="full"
              borderRadius={"2xl"}
              align="flex-start"
              spacing={12}>
              <Box>
                <Skeleton isLoaded={!roundAmountLoading}>
                  {roundAmountError ? (
                    <Text color="red.500">{roundAmountError.message}</Text>
                  ) : (
                    <Heading size="2xl">{compactFormatter.format(totalAmount)}</Heading>
                  )}
                </Skeleton>
                <Text fontSize={"md"} textTransform={"uppercase"}>
                  Total allocation
                </Text>
              </Box>

              <HStack spacing={12}>
                <Skeleton isLoaded={!xAppsLoading}>
                  <Heading size="xl">{xApps?.length}</Heading>
                  <Text fontSize={"md"} textTransform={"uppercase"}>
                    Participating dApps
                  </Text>
                </Skeleton>
                <Skeleton isLoaded={!totalVotersLoading}>
                  <Heading size="xl">{totalVoters}</Heading>
                  <Text fontSize={"md"} textTransform={"uppercase"}>
                    Total voters
                  </Text>
                </Skeleton>
              </HStack>
            </VStack>
          </VStack>
        </Stack>
      </CardBody>
    </Card>
  )
}
