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
import { DotSymbol } from "@/components/DotSymbol"
import { useMemo } from "react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { AllocationStateBadge } from "@/components/AllocationStateBadge"
import { useTranslation } from "react-i18next"

type Props = {
  round: RoundCreated
}

const compactFormatter = getCompactFormatter()

export const AllocationRoundCard: React.FC<Props> = ({ round }) => {
  const { t } = useTranslation()
  const router = useRouter()

  const { data: allocationRound } = useAllocationsRound(round.roundId)
  const {
    data: roundAmount,
    isLoading: roundAmountLoading,
    error: roundAmountError,
  } = useAllocationAmount(round.roundId)

  const totalAmount = useMemo(() => {
    if (!roundAmount) return 0
    return roundAmount.voteXAllocations
  }, [roundAmount])

  const onRoundClick = () => {
    router.push(`/rounds/${round.roundId}`)
  }
  const isActive = useMemo(() => {
    return allocationRound?.state === 0 && allocationRound?.voteEndTimestamp?.isAfter()
  }, [allocationRound])

  const cardActiveBackgroundColor = useColorModeValue("secondary.50", "secondary.100")
  const cardActiveBorderColor = useColorModeValue("secondary.400", "secondary.700")

  const cardTextColor = isActive ? "black" : "inherit"

  const activeHoverBorderColor = useColorModeValue("secondary.500", "secondary.200")

  //TODO: dark mode support
  const nonActiveBackgroundColor = useColorModeValue("rgba(166, 217, 110, 0.12)", "rgba(166, 217, 110, 0.12)")

  return (
    <Card
      borderRadius={"3xl"}
      w="full"
      {...(isActive && {
        bg: cardActiveBackgroundColor,
        borderColor: cardActiveBorderColor,
        borderWidth: "1px",
      })}
      onClick={onRoundClick}
      _hover={{
        ...(isActive && {
          borderColor: activeHoverBorderColor,
        }),
        ...(!isActive && {
          bg: nonActiveBackgroundColor,
        }),
        cursor: "pointer",
        transition: "all 0.2s ease-in-out",
      }}
      data-testid={"round-#" + round.roundId + "-card"}>
      <CardBody>
        <HStack justify={"space-between"} w="full">
          <Stack w="full" spacing={1}>
            <HStack spacing={2} w="fit-content" justify="space-between">
              <AllocationStateBadge
                roundId={round.roundId}
                data-testid={"round-#" + round.roundId + "-status"}
                renderBadge={false}
                renderIcon={false}
              />
              <Show above="sm">
                <DotSymbol color={"gray"} size={1} />
                <Text fontWeight={"400"} color={"gray"}>
                  {isActive
                    ? `ends ${allocationRound.voteEndTimestamp?.fromNow()}`
                    : `${allocationRound.voteStartTimestamp?.fromNow()}`}
                </Text>
              </Show>
            </HStack>

            <HStack mt={0.5} w="full" justify="space-between" color={cardTextColor}>
              <Heading as="h3" size="md">
                {t("Round #{{round}}", {
                  round: round.roundId,
                })}
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
                      <Heading size="lg">{compactFormatter.format(Number(totalAmount))}</Heading>
                      <Text fontSize={"md"}>{t("total allocation")}</Text>
                    </Box>
                  )}
                </Skeleton>
              </Box>
              <Icon
                as={FaAngleRight}
                boxSize={6}
                color={cardTextColor}
                data-testid={"round-#" + round.roundId + "-link"}
              />
            </HStack>
          </Stack>
        </HStack>
      </CardBody>
    </Card>
  )
}
