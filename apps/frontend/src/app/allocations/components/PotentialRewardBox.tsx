"use client"

import { Text, Skeleton, Mark } from "@chakra-ui/react"
import { getConfig } from "@repo/config"
import { Emissions__factory } from "@vechain/vebetterdao-contracts/factories/Emissions__factory"
import { VoterRewards__factory } from "@vechain/vebetterdao-contracts/factories/VoterRewards__factory"
import { useMultipleClausesCall, useThor, useWallet } from "@vechain/vechain-kit"
import { useMemo } from "react"
import { formatEther } from "viem"

import B3TRIcon from "@/components/Icons/svg/b3tr.svg"
import { calculatePotentialRewards } from "@/utils/rewardCalculation"

import type { AllocationRoundDetails } from "../page"

import { StatCard } from "./StatCard"

const voterRewardsAbi = VoterRewards__factory.abi
const voterRewardsAddress = getConfig().voterRewardsContractAddress as `0x${string}`

const emissionsAbi = Emissions__factory.abi
const emissionsAddress = getConfig().emissionsContractAddress as `0x${string}`

export const PotentialRewardBox = ({ roundDetails }: { roundDetails: AllocationRoundDetails }) => {
  const { currentRoundId } = roundDetails
  const { account } = useWallet()
  const thor = useThor()

  const { data, isLoading } = useMultipleClausesCall({
    thor,
    queryKey: ["potentialRewardQueryKey", currentRoundId.toString(), account?.address ?? ""],
    calls: [
      {
        abi: voterRewardsAbi,
        address: voterRewardsAddress,
        functionName: "cycleToTotal" as const,
        args: [BigInt(currentRoundId)],
      },
      {
        abi: voterRewardsAbi,
        address: voterRewardsAddress,
        functionName: "cycleToTotalGMWeight" as const,
        args: [BigInt(currentRoundId)],
      },
      {
        abi: voterRewardsAbi,
        address: voterRewardsAddress,
        functionName: "cycleToVoterToTotal" as const,
        args: [BigInt(currentRoundId), account?.address as `0x{string}`],
      },
      {
        abi: voterRewardsAbi,
        address: voterRewardsAddress,
        functionName: "getGMReward" as const,
        args: [BigInt(currentRoundId), account?.address as `0x{string}`],
      },
      {
        abi: emissionsAbi,
        address: emissionsAddress,
        functionName: "emissions" as const,
        args: [BigInt(currentRoundId)],
      },
    ],
  })

  const potentialReward = useMemo(() => {
    if (data) {
      const [
        cycleTotal,
        cycleTotalGMWeight,
        userVoterTotal,
        userGMWeight,
        [_xAllocationsAmount, vote2EarnAmount, _treasuryAmount, gmAmount],
      ] = data

      return calculatePotentialRewards({
        voterTotal: userVoterTotal,
        cycleTotal: cycleTotal,
        vote2EarnAmount,
        gmEmissionsAmount: gmAmount,
        gmWeightTotal: userGMWeight,
        cycleGMTotal: cycleTotalGMWeight,
        relayerFeePercentage: 10,
        hadAutoVotingEnabled: false,
      })
    }

    return null
  }, [data])

  return (
    <StatCard
      variant="info"
      title="Potential rewards"
      icon={<B3TRIcon />}
      subtitle={
        <Skeleton asChild loading={isLoading || !potentialReward}>
          <Text textStyle={{ base: "sm", md: "2xl" }} lineClamp={1}>
            <Mark variant="text" fontWeight="semibold">
              {potentialReward ? Number(formatEther(potentialReward.netTotal)).toFixed(2) : "-"}
            </Mark>
            {" B3TR"}
          </Text>
        </Skeleton>
      }
    />
  )
}
