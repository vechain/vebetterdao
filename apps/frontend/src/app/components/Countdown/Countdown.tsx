import { useCurrentAllocationsRoundId, useAllocationsRound } from "@/api"
import React, { useEffect, useMemo, useState } from "react"
import { Text, HStack, Image, useMediaQuery, Skeleton } from "@chakra-ui/react"
import { t } from "i18next"
import { timestampToTimeLeftDecomposed, TimeLeft } from "@/utils"
import dayjs from "dayjs"

interface CountdownProps {
  onOpen: () => void
}

export const Countdown = ({ onOpen }: CountdownProps) => {
  const { data: currentRoundId, isLoading: isCurrentRoundIdLoading } = useCurrentAllocationsRoundId()
  const { data: allocationRound, isLoading: isCurrentRoundLoading } = useAllocationsRound(currentRoundId)
  const [isAbove500] = useMediaQuery("(min-width: 500px)")

  const isLoading = isCurrentRoundIdLoading || isCurrentRoundLoading

  const estimatedEndTimestamp = useMemo(() => allocationRound?.voteEndTimestamp?.valueOf(), [allocationRound])
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    if (!estimatedEndTimestamp) return

    const interval = setInterval(() => {
      const _timeLeft = timestampToTimeLeftDecomposed(estimatedEndTimestamp, dayjs().valueOf())
      setTimeLeft(_timeLeft)
    }, 1000)

    return () => clearInterval(interval)
  }, [estimatedEndTimestamp])

  const isNearEnd = (estimatedEndTimestamp ? estimatedEndTimestamp - dayjs().valueOf() : 0) <= 60000
  const isNearEndText = isNearEnd ? "#C84968" : "#004CFC"
  const isNearEndBg = isNearEnd ? "#FCEEF1" : "#E5EEFF"
  const isNearEndIcon = isNearEnd ? "/images/clock-red.svg" : "/images/clock-blue.svg"

  return (
    <Skeleton
      onClick={onOpen}
      cursor={"pointer"}
      as={HStack}
      justify={"space-between"}
      isLoaded={!isLoading}
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
    </Skeleton>
  )
}
