import { Text, HStack, useMediaQuery, Skeleton, Icon, Flex } from "@chakra-ui/react"
import { t } from "i18next"
import { useMemo } from "react"
import Countdown from "react-countdown"
import { FaRegClock } from "react-icons/fa"

import dayjs from "@/utils/dayjsConfig"

import { useAllocationsRound } from "../../../api/contracts/xAllocations/hooks/useAllocationsRound"
import { useCurrentAllocationsRoundId } from "../../../api/contracts/xAllocations/hooks/useCurrentAllocationsRoundId"

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
        px="3"
        py="1"
        rounded={"full"}
        textStyle={isAbove500 ? "xs" : "xxs"}
        height="6"
      />
    )
  }

  return (
    <Countdown
      key={countdownKey}
      date={expiryTimestamp}
      now={() => Date.now()}
      renderer={({ days, hours, minutes, seconds }) => {
        return (
          <Flex as="button" onClick={onOpen} alignItems={"center"} color="actions.primary.text" gap="1">
            <Icon boxSize={4} as={FaRegClock} />
            <Text textStyle={isAbove500 ? "xs" : "xxs"} color="current" fontWeight="semibold">
              {t("Next snapshot")} {days}
              {"d"} {hours}
              {"h"} {minutes}
              {"m"}
            </Text>
            <Text
              textStyle={isAbove500 ? "xs" : "xxs"}
              color="current"
              fontWeight="semibold"
              minW={seconds >= 10 ? "1.4em" : "0.8em"}>
              {seconds}
              {"s"}
            </Text>
          </Flex>
        )
      }}
    />
  )
}
