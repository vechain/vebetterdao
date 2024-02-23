import { RoundCreated, useAllocationAmount, useAllocationsRound } from "@/api"
import {
  Box,
  Card,
  CardBody,
  HStack,
  Heading,
  Icon,
  Show,
  Skeleton,
  Stack,
  Text,
  useColorModeValue,
} from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { FaAngleRight } from "react-icons/fa6"
import { AllocationRoundStateTag } from "../AllocationRoundStateTag"
import { DotSymbol } from "@/components/DotSymbol"
import { useMemo } from "react"

type Props = {
  round: RoundCreated
}

const compactFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  compactDisplay: "short",
})

export const AllocationRoundCard: React.FC<Props> = ({ round }) => {
  const router = useRouter()

  const { data: allocationRound } = useAllocationsRound(round.roundId)
  const {
    data: roundAmount,
    isLoading: roundAmountLoading,
    error: roundAmountError,
  } = useAllocationAmount(round.roundId)

  const totalAmount = useMemo(() => {
    if (!roundAmount) return 0
    return BigInt(roundAmount.voteXAllocations)
  }, [roundAmount])

  const onRoundClick = () => {
    router.push(`/rounds/${round.roundId}`)
  }
  const isActive = useMemo(() => {
    return allocationRound?.state === "0" && allocationRound?.voteEndTimestamp?.isAfter()
  }, [allocationRound, allocationRound?.state])

  const cardActiveBackroundColor = useColorModeValue("secondary.100", "secondary.200")

  const cardTextColor = isActive ? "black" : "inherit"

  const activeBorderColor = useColorModeValue("secondary.500", "black")
  const defaultBorderColor = useColorModeValue("transparent", "gray.500")

  const activeHoverBorderColor = useColorModeValue("secondary.700", "secondary.700")
  const defaultHoverBorderColor = useColorModeValue("gray.400", "gray.200")

  return (
    <Card
      w="full"
      variant="elevated"
      borderWidth={1}
      backgroundColor={isActive ? cardActiveBackroundColor : "transparent"}
      borderColor={isActive ? activeBorderColor : defaultBorderColor}
      onClick={onRoundClick}
      _hover={{
        borderColor: isActive ? activeHoverBorderColor : defaultHoverBorderColor,
        cursor: "pointer",
        transition: "all 0.2s ease-in-out",
      }}>
      <CardBody>
        <HStack justify={"space-between"} w="full">
          <Stack w="full" spacing={1}>
            <HStack spacing={2} w="fit-content" justify="space-between">
              <AllocationRoundStateTag state={allocationRound.state} size="md" />
              <Show above="sm">
                <DotSymbol color={cardTextColor} />
                <Text fontWeight={"200"} color={cardTextColor}>
                  {isActive
                    ? `ends ${allocationRound.voteEndTimestamp?.fromNow()}`
                    : `${allocationRound.voteStartTimestamp?.fromNow()}`}
                </Text>
              </Show>
            </HStack>

            <HStack w="full" justify="space-between" color={cardTextColor}>
              <Heading as="h3" size="md">
                Round #{round.roundId}
              </Heading>
            </HStack>
            <HStack w="fit-content" justify="space-between" fontSize={"sm"} color={cardTextColor}>
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
                    <Box textAlign={"end"} color={cardTextColor}>
                      <Heading size="lg">{compactFormatter.format(totalAmount)}</Heading>
                      <Text fontSize={"md"}>total allocation</Text>
                    </Box>
                  )}
                </Skeleton>
              </Box>
              <Icon as={FaAngleRight} boxSize={6} color={cardTextColor} />
            </HStack>
          </Stack>
        </HStack>
      </CardBody>
    </Card>
  )
}
