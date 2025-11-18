"use client"

import { Text, Mark } from "@chakra-ui/react"
import { getConfig } from "@repo/config"
import { XAllocationVoting__factory } from "@vechain/vebetterdao-contracts/factories/XAllocationVoting__factory"
import { useCallClause } from "@vechain/vechain-kit"
import { Clock } from "iconoir-react"
import Countdown from "react-countdown"

import { useBestBlockCompressed } from "@/hooks/useGetBestBlockCompressed"
import { blockNumberToDate } from "@/utils/date"

import { StatCard } from "./StatCard"

const xAllocationVotingAbi = XAllocationVoting__factory.abi
const xAllocationVotingAddress = getConfig().xAllocationVotingContractAddress as `0x${string}`

export const CountdownBox = () => {
  const { data: [deadlineBlock] = [], isLoading } = useCallClause({
    abi: xAllocationVotingAbi,
    address: xAllocationVotingAddress,
    method: "currentRoundDeadline" as const,
    args: [],
  })
  const { data: bestBlockCompressed, isLoading: iseLoadingBestBlockCompressed } = useBestBlockCompressed()
  return (
    <StatCard
      isLoading={isLoading || iseLoadingBestBlockCompressed}
      variant="warning"
      icon={<Clock />}
      title={"Left to vote"}
      subtitle={
        deadlineBlock ? (
          <Countdown
            now={() => Date.now()}
            date={blockNumberToDate(deadlineBlock, bestBlockCompressed)}
            renderer={({ days, hours, minutes }) => (
              <Text textStyle={{ base: "sm", md: "2xl" }}>
                <Mark variant="text" fontWeight="semibold">
                  {days}
                </Mark>
                {"d "}
                <Mark variant="text" fontWeight="semibold">
                  {hours}
                </Mark>
                {"h "}
                <Mark variant="text" fontWeight="semibold">
                  {minutes}
                </Mark>
                {"m "}
              </Text>
            )}
          />
        ) : (
          ""
        )
      }
    />
  )
}
