import { useCurrentAllocationsRoundId, useAllocationsRound } from "@/api"
import { Text, HStack, Image, useMediaQuery, Skeleton } from "@chakra-ui/react"
import { t } from "i18next"
import { useMemo } from "react"
import Countdown from "react-countdown"
import dayjs from "@/utils/dayjsConfig"

interface CountdownProps {
  onOpen: () => void
}

export const CountdownVoting = ({ onOpen }: CountdownProps) => {
  const [isAbove500] = useMediaQuery(["(min-width: 500px)"])

  const { data: currentRoundId, isLoading: isCurrentRoundIdLoading } = useCurrentAllocationsRoundId()
  const { data: allocationRound, isLoading: isCurrentRoundLoading } = useAllocationsRound(currentRoundId)

  const expiryTimestamp = useMemo(() => {
    // no round left, most likely in test mode
    if (allocationRound?.state === 1) {
      return dayjs().valueOf()
    }
    // fallback to 7 days in the future if cached just after new round
    if (allocationRound?.voteEndTimestamp?.isBefore(dayjs())) {
      return dayjs().add(7, "day").valueOf()
    }

    // For accuracy in the UI, we round to the nearest minute
    const endTime = allocationRound?.voteEndTimestamp?.toDate()
    return endTime
  }, [allocationRound?.voteEndTimestamp, allocationRound?.state])

  const countdownKey = `countdown-${allocationRound?.roundId ?? "initial"}`

  const isLoading = isCurrentRoundIdLoading || isCurrentRoundLoading || !allocationRound?.voteEndTimestamp

  // Show loading state
  if (isLoading) {
    return (
      <Skeleton
        as={HStack}
        justifyContent={"space-between"}
        px={3}
        py={1}
        rounded={"full"}
        textStyle={isAbove500 ? "xs" : "xxs"}
        height="24px"
      />
    )
  }

  return (
    <Countdown
      key={countdownKey}
      date={expiryTimestamp}
      now={() => Date.now()}
      renderer={({ days, hours, minutes, seconds }) => {
        // Check if near end (1 hour or less)
        const isNearEnd = days === 0 && hours <= 1
        const isNearEndText = isNearEnd ? "#C84968" : "#004CFC"
        const isNearEndBg = isNearEnd ? "#FCEEF1" : "#E5EEFF"
        const isNearEndIcon = isNearEnd ? "/assets/icons/clock-red.svg" : "/assets/icons/clock-blue.svg"

        return (
          <HStack
            onClick={onOpen}
            cursor={"pointer"}
            justify={"space-between"}
            px={3}
            py={1}
            rounded={"full"}
            color={isNearEndText}
            bg={isNearEndBg}
            borderColor={"#F2F2F2"}
            textStyle={isAbove500 ? "xs" : "xxs"}
            fontWeight={600}
            gap={1}>
            <Image src={isNearEndIcon} alt="clock" boxSize={"20px"} />
            <Text>{t("Next snapshot")}</Text>
            <HStack gap={0}>
              <Text>{days}</Text>
              <Text>{"d"}</Text>
            </HStack>

            <HStack gap={0}>
              <Text>{hours}</Text>
              <Text>{"h"}</Text>
            </HStack>

            <HStack gap={0}>
              <Text>{minutes}</Text>
              <Text>{"m"}</Text>
            </HStack>
            <HStack gap={0}>
              <Text minW={seconds >= 10 ? "1.4em" : "0.8em"}>{seconds}</Text>
              <Text>{"s"}</Text>
            </HStack>
          </HStack>
        )
      }}
    />
  )
}
