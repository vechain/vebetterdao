"use client"

import { Text, Skeleton, Mark } from "@chakra-ui/react"
import { getConfig } from "@repo/config"
import { VoterRewards__factory } from "@vechain/vebetterdao-contracts/factories/VoterRewards__factory"
import { useCallClause, useWallet } from "@vechain/vechain-kit"
import { useMemo } from "react"
import { formatEther } from "viem"

import B3TRIcon from "@/components/Icons/svg/b3tr.svg"
import { calculatePotentialRewards } from "@/utils/rewardCalculation"

import type { AllocationCurrentRoundDetails } from "../page"

import { StatCard } from "./StatCard"

const voterRewardsAbi = VoterRewards__factory.abi
const voterRewardsAddress = getConfig().voterRewardsContractAddress as `0x${string}`

export const PotentialRewardBox = ({ currentRoundDetails }: { currentRoundDetails: AllocationCurrentRoundDetails }) => {
  const { id, cycleTotal, vote2EarnAmount, gmAmount, cycleTotalGMWeight } = currentRoundDetails
  const { account } = useWallet()

  const { data: userVoterTotal, isLoading: isUserVoterTotalLoading } = useCallClause({
    abi: voterRewardsAbi,
    address: voterRewardsAddress,
    method: "cycleToVoterToTotal",
    args: [BigInt(id), account?.address as `0x{string}`],
    queryOptions: { select: data => data[0] },
  })

  const { data: userGMWeight, isLoading: isUserGMWeightLoading } = useCallClause({
    abi: voterRewardsAbi,
    address: voterRewardsAddress,
    method: "getGMReward",
    args: [BigInt(id), account?.address as `0x{string}`],
    queryOptions: { select: data => data[0] },
  })

  const isLoading = isUserVoterTotalLoading || isUserGMWeightLoading

  const potentialReward = useMemo(
    () =>
      userVoterTotal !== undefined && userGMWeight !== undefined
        ? calculatePotentialRewards({
            voterTotal: userVoterTotal,
            cycleTotal: cycleTotal,
            vote2EarnAmount,
            gmEmissionsAmount: gmAmount,
            gmWeightTotal: userGMWeight,
            cycleGMTotal: cycleTotalGMWeight,
            relayerFeePercentage: 10,
            hadAutoVotingEnabled: false,
          })
        : null,
    [cycleTotal, cycleTotalGMWeight, gmAmount, userGMWeight, userVoterTotal, vote2EarnAmount],
  )

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
