import { RoundCreated, useAllocationAmount, useAllocationsRound, useCurrentAllocationsRoundId } from "@/api"
import {
  Box,
  Card,
  CardBody,
  HStack,
  Heading,
  Icon,
  Skeleton,
  Stack,
  Text,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { FaAngleRight } from "react-icons/fa6"
import { AllocationRoundStateTag } from "../AllocationRoundStateTag"
import { DotSymbol } from "@/components/DotSymbol"
import { useMemo } from "react"

type Props = {
  round: RoundCreated
  cardBorderColor?: string
}

const compactFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  compactDisplay: "short",
})

export const AllocationRoundCard: React.FC<Props> = ({ round, cardBorderColor = "transparent" }) => {
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

  const { data: currentRound } = useAllocationsRound(round.roundId)

  const isCurrentRoundActive = useMemo(() => {
    return currentRound?.state === "0"
  }, [currentRound])

  const cardHoverColor = useColorModeValue("gray.300", "secondary.300")

  return (
    <Card
      w="full"
      variant="outline"
      borderWidth={1}
      backgroundColor={isCurrentRoundActive ? "secondary.100" : "transparent"}
      borderColor={isCurrentRoundActive ? "secondary.100" : cardBorderColor}
      onClick={onRoundClick}
      _hover={{
        borderColor: cardHoverColor,
        cursor: "pointer",
        transition: "all 0.2s ease-in-out",
      }}>
      <CardBody>
        <HStack justify={"space-between"} w="full">
          <Stack w="full" spacing={1}>
            <HStack spacing={2} w="fit-content" justify="space-between">
              <AllocationRoundStateTag state={allocationRound.state} size="md" />
              <DotSymbol />
              <Text fontWeight={"200"}>{allocationRound.voteStartTimestamp?.fromNow()}</Text>
            </HStack>
            <HStack w="full" justify="space-between">
              <Heading as="h3" size="md">
                Round #{round.roundId}
              </Heading>
            </HStack>
            <HStack w="fit-content" justify="space-between" fontSize={"sm"}>
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
                      <Heading size="lg">{compactFormatter.format(totalAmount)}</Heading>
                      <Text fontSize={"md"}>total allocation</Text>
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
  )
}
