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
import { B3TRIcon } from "@/components/Icons"
import { AllocationRoundParticipatingXApps } from "./AllocationRoundParticipatingXApps"

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
    return Object.values(roundAmount).reduce((acc, amount) => acc + Number(amount), 0)
  }, [roundAmount])

  const onRoundClick = () => {
    router.push(`/rounds/${round.roundId}`)
  }
  const isActive = useMemo(() => {
    return allocationRound?.state === 0 && allocationRound?.voteEndTimestamp?.isAfter()
  }, [allocationRound])

  const cardActiveBackgroundColor = "#E9FDF1"
  const cardActiveBorderColor = "#3DBA67"

  const cardTextColor = isActive ? "black" : "inherit"

  //TODO: dark mode support
  const nonActiveBackgroundColor = useColorModeValue("rgba(166, 217, 110, 0.12)", "rgba(166, 217, 110, 0.12)")

  return (
    <Card
      variant={"baseWithBorder"}
      borderRadius={"24px"}
      w="full"
      {...(isActive && {
        bg: cardActiveBackgroundColor,
        borderColor: cardActiveBorderColor,
        borderWidth: "1px",
      })}
      onClick={onRoundClick}
      _hover={{
        bg: isActive ? cardActiveBackgroundColor : nonActiveBackgroundColor,
        cursor: "pointer",
        transition: "all 0.2s ease-in-out",
      }}
      data-testid={"round-#" + round.roundId + "-card"}>
      <CardBody py="20px">
        <HStack justify={"space-between"} w="full">
          <Stack w="full" spacing={1} flex={2}>
            <HStack spacing={2} w="fit-content" justify="space-between">
              <AllocationStateBadge
                roundId={round.roundId}
                data-testid={"round-#" + round.roundId + "-status"}
                renderBadge={false}
                renderIcon={isActive}
              />
              <Show above="sm">
                <DotSymbol color={"#6A6A6A"} size={"4px"} />
                <Text fontWeight={400} color={"#6A6A6A"} fontSize={"14px"}>
                  {isActive
                    ? `ends ${allocationRound.voteEndTimestamp?.fromNow()}`
                    : `${allocationRound.voteStartTimestamp?.fromNow()}`}
                </Text>
              </Show>
            </HStack>

            <HStack mt={0.5} w="full" justify="space-between" color={cardTextColor}>
              <Heading as="h3" fontSize="20px" fontWeight={700}>
                {t("Round #{{round}}", {
                  round: round.roundId,
                })}
              </Heading>
            </HStack>
            <HStack w="fit-content" justify="space-between" fontSize={"12px"} fontWeight={400} color={cardTextColor}>
              <Text>
                {allocationRound.voteStartTimestamp?.format("MMM D")} {" - "}
                {allocationRound.voteEndTimestamp?.format("MMM D")}
              </Text>
            </HStack>
          </Stack>
          <HStack spacing={4} justify="flex-end" flex={1}>
            <Stack direction={["column", "column", "row"]} spacing={4} align={["flex-end", "flex-end", "center"]}>
              <Box width={"max-content"} justifyContent={"end"}>
                <Skeleton isLoaded={!roundAmountLoading}>
                  {roundAmountError ? (
                    <Text color="red.500">{roundAmountError.message}</Text>
                  ) : (
                    <Box textAlign={"end"} color={cardTextColor}>
                      <HStack spacing={1}>
                        <Heading fontSize="24px" fontWeight={700}>
                          {compactFormatter.format(Number(totalAmount))}
                        </Heading>
                        <B3TRIcon boxSize={"20px"} colorVariant="dark" />
                      </HStack>
                      <Text fontSize={"14px"} fontWeight={400}>
                        {t("total allocation")}
                      </Text>
                    </Box>
                  )}
                </Skeleton>
              </Box>

              <AllocationRoundParticipatingXApps roundId={round.roundId} />
            </Stack>
            <Icon
              as={FaAngleRight}
              boxSize={"24px"}
              color={cardTextColor}
              data-testid={"round-#" + round.roundId + "-link"}
            />
          </HStack>
        </HStack>
      </CardBody>
    </Card>
  )
}
