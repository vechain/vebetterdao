import { useCurrentAllocationsRoundId, useAllocationsRound } from "@/api"
import { Text, HStack, Image, useMediaQuery, Skeleton } from "@chakra-ui/react"
import { t } from "i18next"
import { useEffect } from "react"
import { useTimer } from "react-timer-hook"

interface CountdownProps {
  onOpen: () => void
}

export const Countdown = ({ onOpen }: CountdownProps) => {
  const { data: currentRoundId, isLoading: isCurrentRoundIdLoading } = useCurrentAllocationsRoundId()
  const { data: allocationRound, isLoading: isCurrentRoundLoading } = useAllocationsRound(currentRoundId)
  const [isAbove500] = useMediaQuery("(min-width: 500px)")

  const isLoading = isCurrentRoundIdLoading || isCurrentRoundLoading || !allocationRound?.voteEndTimestamp

  const timeLeft = useTimer({
    expiryTimestamp: allocationRound?.voteEndTimestamp?.toDate() ?? new Date(),
  })

  // Hard refresh the timer when the roundId changes ( more trustable )
  useEffect(() => {
    if (allocationRound?.roundId && allocationRound?.voteEndTimestamp) {
      console.log("Restarting timer for round:", allocationRound.roundId)
      timeLeft.restart(allocationRound.voteEndTimestamp.toDate(), true)
    }
  }, [allocationRound?.roundId])

  // show small rounded loading state
  if (isLoading) {
    return (
      <Skeleton
        as={HStack}
        justify={"space-between"}
        px={3}
        py={1}
        rounded={"full"}
        fontSize={isAbove500 ? "13px" : "10px"}
        height="24px"
      />
    )
  }

  //check if near is close to 1h
  const isNearEnd = timeLeft.days === 0 && timeLeft.hours <= 1
  const isNearEndText = isNearEnd ? "#C84968" : "#004CFC"
  const isNearEndBg = isNearEnd ? "#FCEEF1" : "#E5EEFF"
  const isNearEndIcon = isNearEnd ? "/images/clock-red.svg" : "/images/clock-blue.svg"

  return (
    <HStack
      onClick={onOpen}
      cursor={"pointer"}
      justify={"space-between"}
      px={3}
      py={1}
      rounded={"full"}
      textColor={isNearEndText}
      bg={isNearEndBg}
      borderColor={"#F2F2F2"}
      fontSize={isAbove500 ? "13px" : "10px"}
      fontWeight={600}
      spacing={1}>
      <Image src={isNearEndIcon} alt="clock" boxSize={"20px"} />
      <Text>{t("Next snapshot")}</Text>
      <HStack spacing={0}>
        <Text>{timeLeft.days}</Text>
        <Text>{"d"}</Text>
      </HStack>

      <HStack spacing={0}>
        <Text>{timeLeft.hours}</Text>
        <Text>{"h"}</Text>
      </HStack>

      <HStack spacing={0}>
        <Text>{timeLeft.minutes}</Text>
        <Text>{"m"}</Text>
      </HStack>
      <HStack spacing={0}>
        <Text minW={timeLeft.seconds >= 10 ? "1.4em" : "0.8em"}>{timeLeft.seconds}</Text>
        <Text>{"s"}</Text>
      </HStack>
    </HStack>
  )
}
