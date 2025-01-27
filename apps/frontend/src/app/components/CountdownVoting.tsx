import { useCurrentAllocationsRoundId, useAllocationsRound } from "@/api"
import React, { useEffect, useState } from "react"
import { Card, CardBody, Heading, Text, VStack, HStack } from "@chakra-ui/react"
import { t } from "i18next"

export const CountdownVoting = () => {
  const { data: currentRoundId } = useCurrentAllocationsRoundId()
  const { data: allocationRound } = useAllocationsRound(currentRoundId)

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

  return (
    <Card w={"full"} variant={"baseWithBorder"}>
      <CardBody>
        <Heading size="md" mb={4}>
          {t("Remaining Time")}
        </Heading>

        <HStack spacing={4} justify={"space-between"} p={4} borderRadius={"10px"} borderColor={"#F2F2F2"}>
          <VStack textAlign={"center"} fontSize={"2rem"} color={"#333"}>
            <Heading color={"#004CFC"}>{days}</Heading>
            <Text fontSize={"1rem"} color={"#6A6A6A"}>
              {t("Days")}
            </Text>
          </VStack>

          <VStack textAlign={"center"} fontSize={"2rem"} color={"#333"}>
            <Heading color={"#004CFC"}>{hours}</Heading>
            <Text fontSize={"1rem"} color={"#6A6A6A"}>
              {t("Hours")}
            </Text>
          </VStack>

          <VStack textAlign={"center"} fontSize={"2rem"} color={"#333"}>
            <Heading color={"#004CFC"}>{minutes}</Heading>
            <Text fontSize={"1rem"} color={"#6A6A6A"}>
              {t("Minutes")}
            </Text>
          </VStack>

          <VStack textAlign={"center"} fontSize={"2rem"} color={"#333"}>
            <Heading color={"#004CFC"}>{seconds}</Heading>
            <Text fontSize={"1rem"} color={"#6A6A6A"}>
              {t("Seconds")}
            </Text>
          </VStack>
        </HStack>

        <Text textAlign={"center"} color={"#6A6A6A"}>
          {t("Vote before the round ends!")}
        </Text>
      </CardBody>
    </Card>
  )
}
