import { useCurrentAllocationsRoundId, useAllocationsRound } from "@/api"
import React, { useEffect, useState } from "react"
import { Text, HStack, Image, useMediaQuery } from "@chakra-ui/react"
import { t } from "i18next"

interface CountdownProps {
  onOpen: () => void
}

export const Countdown = ({ onOpen }: CountdownProps) => {
  const { data: currentRoundId } = useCurrentAllocationsRoundId()
  const { data: allocationRound } = useAllocationsRound(currentRoundId)
  const [isAbove500] = useMediaQuery("(min-width: 500px)")

  const estimatedEndTimestamp = allocationRound?.voteEndTimestamp?.valueOf()
  const [timeLeft, setTimeLeft] = useState<number>(estimatedEndTimestamp ? estimatedEndTimestamp - Date.now() : 0)

  useEffect(() => {
    const interval = setInterval(() => {
      if (!timeLeft) return

      const newTimeLeft = timeLeft - 1000

      if (newTimeLeft <= 0) {
        setTimeLeft(0)
        clearInterval(interval)
      } else {
        setTimeLeft(newTimeLeft)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [timeLeft])

  const getFormattedTime = (milliseconds: number | undefined) => {
    if (!milliseconds) return { days: 0, hours: 0, minutes: 0, seconds: 0 }

    let total_seconds = Math.floor(milliseconds / 1000)
    let total_minutes = Math.floor(total_seconds / 60)
    let total_hours = Math.floor(total_minutes / 60)
    let days = Math.floor(total_hours / 24)

    let seconds = total_seconds % 60
    let minutes = total_minutes % 60
    let hours = total_hours % 24

    return { days, hours, minutes, seconds }
  }
  const { days, hours, minutes, seconds } = getFormattedTime(timeLeft)

  const isNearEnd = timeLeft <= 60000
  const isNearEndText = isNearEnd ? "#C84968" : "#004CFC"
  const isNearEndBg = isNearEnd ? "#FCEEF1" : "#E5EEFF"
  const isNearEndIcon = isNearEnd ? "/images/clock-red.svg" : "/images/clock-blue.svg"

  return (
    <HStack justify={"space-between"} onClick={onOpen} cursor={"pointer"}>
      <HStack
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
        <HStack spacing={1}>
          <HStack spacing={0}>
            <Text>{days}</Text>
            <Text>{"d"}</Text>
          </HStack>

          <HStack spacing={0}>
            <Text>{hours}</Text>
            <Text>{"h"}</Text>
          </HStack>

          <HStack spacing={0}>
            <Text>{minutes}</Text>
            <Text>{"m"}</Text>
          </HStack>

          <HStack spacing={0}>
            <Text minW={seconds >= 10 ? "1.4em" : "0.8em"}>{seconds}</Text>
            <Text>{"s"}</Text>
          </HStack>
        </HStack>
      </HStack>
    </HStack>
  )
}
