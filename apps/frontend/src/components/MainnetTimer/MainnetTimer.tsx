import { HStack, Stack, Text, VStack, useBreakpoint, useBreakpointValue } from "@chakra-ui/react"
import dayjs from "dayjs"
import padStart from "lodash/padStart"
import { useEffect, useState } from "react"

const mainnetLaunch = dayjs("2024-06-28")

export const MainnetTimer = () => {
  const [_, setTime] = useState(0)

  const days = padStart(mainnetLaunch.diff(dayjs(), "days").toString(), 2, "0")
  const hours = padStart((mainnetLaunch.diff(dayjs(), "hours") % 24).toString(), 2, "0")
  const minutes = padStart((mainnetLaunch.diff(dayjs(), "minutes") % 60).toString(), 2, "0")

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(prev => prev + 1)
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
      p="60px"
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
              {days}
            </Text>
            <Text fontSize="16px" fontWeight="600" textAlign={"center"}>
              {"DAYS"}
            </Text>
          </VStack>
          <VStack>
            <Text rounded="13px" p="28px 18px" bg="#FFFFFF" fontSize="28px" fontWeight={700}>
              {hours}
            </Text>
            <Text fontSize="16px" fontWeight="600" textAlign={"center"}>
              {"HOURS"}
            </Text>
          </VStack>
          <VStack>
            <Text rounded="13px" p="28px 18px" bg="#FFFFFF" fontSize="28px" fontWeight={700}>
              {minutes}
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
