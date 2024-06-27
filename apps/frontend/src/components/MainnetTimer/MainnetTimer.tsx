import { HStack, Stack, Text, VStack, useBreakpointValue } from "@chakra-ui/react"
import dayjs from "dayjs"
import duration from "dayjs/plugin/duration"
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"
import padStart from "lodash/padStart"
import { useEffect, useState } from "react"

dayjs.extend(duration)
dayjs.extend(utc)
dayjs.extend(timezone)

const mainnetLaunch = dayjs.tz("2024-06-28T00:00:00", "Europe/Dublin")

export const MainnetTimer = () => {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft())

  function getTimeLeft() {
    const now = dayjs()
    const duration = dayjs.duration(mainnetLaunch.diff(now))

    const days = padStart(duration.days().toString(), 2, "0")
    const hours = padStart(duration.hours().toString(), 2, "0")
    const minutes = padStart(duration.minutes().toString(), 2, "0")

    return { days, hours, minutes }
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft())
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  return (
    <Stack
      align="stretch"
      bgImage={useBreakpointValue({
        base: "url('/images/timer-background-mobile.png')",
        md: "url('/images/timer-background.png')",
      })}
      backgroundSize={"cover"}
      bgPos={["right", "center"]}
      p={["20px", "60px"]}
      rounded="12px"
      color="#252525"
      fontSize="16px"
      flexDir={["column", "row"]}
      gap={[8, 4]}>
      <VStack gap={1} align="flex-start" flex={1}>
        <Text fontWeight="700" color="#004CFC">
          {"June 28th"}
        </Text>
        <Text fontSize={["28px", "36px"]} fontWeight="700">
          {"Mainnet Launch"}
        </Text>
        <Text fontWeight="600">{"We're moving from TestNet to MainNet!"}</Text>
        <Text fontWeight="400">{"Some platform actions will be temporarily disabled. Stay tuned for updates."}</Text>
      </VStack>
      <VStack justify={["flex-start", "center"]} flex={1}>
        <HStack>
          <VStack>
            <Text rounded="13px" p="28px 18px" bg="#FFFFFF" fontSize="28px" fontWeight={700}>
              {timeLeft.days}
            </Text>
            <Text fontSize="16px" fontWeight="600" textAlign={"center"}>
              {"DAYS"}
            </Text>
          </VStack>
          <VStack>
            <Text rounded="13px" p="28px 18px" bg="#FFFFFF" fontSize="28px" fontWeight={700}>
              {timeLeft.hours}
            </Text>
            <Text fontSize="16px" fontWeight="600" textAlign={"center"}>
              {"HOURS"}
            </Text>
          </VStack>
          <VStack>
            <Text rounded="13px" p="28px 18px" bg="#FFFFFF" fontSize="28px" fontWeight={700}>
              {timeLeft.minutes}
            </Text>
            <Text fontSize="16px" fontWeight="600" textAlign={"center"}>
              {"MINS"}
            </Text>
          </VStack>
        </HStack>
      </VStack>
    </Stack>
  )
}
