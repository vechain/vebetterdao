import { RoundCreated, useAllocationAmount, useAllocationsRound } from "@/api"
import { Box, Card, CardBody, HStack, Heading, Icon, Skeleton, Stack, Text, useColorModeValue } from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { FaAngleRight } from "react-icons/fa6"
import { AllocationRoundStateTag } from "../AllocationRoundStateTag"
import { DotSymbol } from "@/components/DotSymbol"
import { useMemo } from "react"

type Props = {
  round: RoundCreated
  variant?: "compact" | "full"
}

const compactFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  compactDisplay: "short",
})

export const AllocationRoundCard: React.FC<Props> = ({ round, variant = "compact" }) => {
  const router = useRouter()

  const { data: allocationRound } = useAllocationsRound(round.roundId)
  const {
    data: roundAmount,
    isLoading: roundAmountLoading,
    error: roundAmountError,
  } = useAllocationAmount(round.roundId)

  const totalAmount = useMemo(() => {
    if (!roundAmount) return 0
    return BigInt(roundAmount.treasury) + BigInt(roundAmount.voteX2Earn) + BigInt(roundAmount.voteXAllocations)
  }, [roundAmount])

  const onRoundClick = () => {
    router.push(`/rounds/${round.roundId}`)
  }

  const cardHoverColor = useColorModeValue("primary.500", "primary.300")
  return (
    <>
      {variant === "full" ? (
        <Card
          w="full"
          variant="outline"
          borderWidth={allocationRound.isCurrent ? 3 : 1}
          borderColor={allocationRound.isCurrent ? "primary.500" : "inherit"}
          onClick={onRoundClick}
          _hover={{
            borderColor: cardHoverColor,
            cursor: "pointer",
            transition: "all 0.2s ease-in-out",
          }}>
          <CardBody>
            <HStack justify={"space-between"} w="full">
              <Stack w="full" spacing={2}>
                <HStack spacing={2} w="fit-content" justify="space-between">
                  <AllocationRoundStateTag state={allocationRound.state} size="md" />
                  <DotSymbol />
                  <Text fontWeight={"100"}>{allocationRound.voteStartTimestamp?.fromNow()}</Text>
                </HStack>
                <HStack spacing={2} w="full" justify="space-between">
                  <Heading as="h3" size="md">
                    Round #{round.roundId}
                  </Heading>
                </HStack>
                <HStack spacing={2} w="fit-content" justify="space-between" fontSize={"sm"}>
                  <Text>
                    {allocationRound.voteStartTimestamp?.format("MMM D")} {" - "}
                    {allocationRound.voteEndTimestamp?.format("MMM D")}
                  </Text>
                </HStack>
              </Stack>
              <Stack w={"auto"}>
                <HStack spacing={2} justify="space-between">
                  <Box width={"max-content"} justifyContent={"end"}>
                    <Skeleton isLoaded={!roundAmountLoading}>
                      {roundAmountError ? (
                        <Text color="red.500">{roundAmountError.message}</Text>
                      ) : (
                        <Box textAlign={"end"}>
                          <Heading size="xl">{compactFormatter.format(totalAmount)}</Heading>
                          <Text fontSize={"xs"}>total allocation</Text>
                        </Box>
                      )}
                    </Skeleton>
                  </Box>
                  <Icon as={FaAngleRight} boxSize={6} />
                </HStack>
              </Stack>
            </HStack>
          </CardBody>
        </Card>
      ) : (
        <Card
          w="full"
          variant="outline"
          borderWidth={allocationRound.isCurrent ? 3 : 1}
          onClick={onRoundClick}
          _hover={{
            borderColor: cardHoverColor,
            cursor: "pointer",
            transition: "all 0.2s ease-in-out",
          }}>
          <CardBody>
            <HStack justify={"space-between"} w="full">
              <Box w="full">
                <HStack spacing={2} w="full" justify="space-between">
                  <Heading as="h3" size="md">
                    Round #{round.roundId}
                  </Heading>
                  <AllocationRoundStateTag state={allocationRound.state} size="md" />
                </HStack>
                <Text>{allocationRound.voteEndTimestamp?.fromNow()}</Text>
              </Box>
              <Icon as={FaAngleRight} boxSize={6} />
            </HStack>
          </CardBody>
        </Card>
      )}
    </>
  )
}
