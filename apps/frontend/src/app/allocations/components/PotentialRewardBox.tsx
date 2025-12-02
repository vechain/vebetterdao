"use client"

import { Text, Skeleton, Mark } from "@chakra-ui/react"
import { getConfig } from "@repo/config"
import { Emissions__factory } from "@vechain/vebetterdao-contracts/factories/Emissions__factory"
import { RelayerRewardsPool__factory } from "@vechain/vebetterdao-contracts/factories/RelayerRewardsPool__factory"
import { VoterRewards__factory } from "@vechain/vebetterdao-contracts/factories/VoterRewards__factory"
import { XAllocationVoting__factory } from "@vechain/vebetterdao-contracts/factories/XAllocationVoting__factory"
import { useCallClause, useMultipleClausesCall, useThor, useWallet } from "@vechain/vechain-kit"
import { useMemo } from "react"
import { formatEther } from "viem"

import B3TRIcon from "@/components/Icons/svg/b3tr.svg"
import { calculatePotentialRewards } from "@/utils/rewardCalculation"

import { StatCard } from "./StatCard"

const voterRewardsAbi = VoterRewards__factory.abi
const voterRewardsAddress = getConfig().voterRewardsContractAddress as `0x${string}`

const emissionsAbi = Emissions__factory.abi
const emissionsAddress = getConfig().emissionsContractAddress as `0x${string}`

const xAllocationVotingAbi = XAllocationVoting__factory.abi
const xAllocationVotingAddress = getConfig().xAllocationVotingContractAddress as `0x${string}`

const relayerRewardsAbi = RelayerRewardsPool__factory.abi
const relayerRewardsAddress = getConfig().relayerRewardsPoolContractAddress as `0x${string}`

export const PotentialRewardBox = () => {
  const { account } = useWallet()
  const thor = useThor()

  const { data: currentRoundId } = useCallClause({
    abi: xAllocationVotingAbi,
    address: xAllocationVotingAddress,
    method: "currentRoundId" as const,
    args: [],
    queryOptions: { select: data => data[0] },
  })

  const { data, isLoading } = useMultipleClausesCall({
    thor,
    queryKey: ["potentialRewardQueryKey", (currentRoundId || "").toString(), account?.address ?? ""],
    calls: [
      {
        abi: voterRewardsAbi,
        address: voterRewardsAddress,
        functionName: "cycleToTotal" as const,
        args: [currentRoundId!],
      },
      {
        abi: voterRewardsAbi,
        address: voterRewardsAddress,
        functionName: "cycleToTotalGMWeight" as const,
        args: [currentRoundId!],
      },
      {
        abi: voterRewardsAbi,
        address: voterRewardsAddress,
        functionName: "cycleToVoterToTotal" as const,
        args: [currentRoundId!, account?.address as `0x{string}`],
      },
      {
        abi: voterRewardsAbi,
        address: voterRewardsAddress,
        functionName: "getGMReward" as const,
        args: [currentRoundId!, account?.address as `0x{string}`],
      },
      {
        abi: emissionsAbi,
        address: emissionsAddress,
        functionName: "emissions" as const,
        args: [currentRoundId!],
      },
      {
        abi: relayerRewardsAbi,
        address: relayerRewardsAddress,
        functionName: "getRelayerFeePercentage" as const,
        args: [],
      },
      {
        abi: xAllocationVotingAbi,
        address: xAllocationVotingAddress,
        functionName: "isUserAutoVotingEnabledInCurrentRound" as const,
        args: [(account?.address || "") as `0x${string}`],
      },
    ],
    enabled: !!thor && !!currentRoundId,
  })

  const potentialReward = useMemo(() => {
    if (data) {
      const [
        cycleTotal,
        cycleTotalGMWeight,
        userVoterTotal,
        userGMWeight,
        [_xAllocationsAmount, vote2EarnAmount, _treasuryAmount, gmAmount],
        relayerFeePercentage,
        hadAutoVotingEnabled = false,
      ] = data

      return calculatePotentialRewards({
        voterTotal: userVoterTotal,
        cycleTotal: cycleTotal,
        vote2EarnAmount,
        gmEmissionsAmount: gmAmount,
        gmWeightTotal: userGMWeight,
        cycleGMTotal: cycleTotalGMWeight,
        relayerFeePercentage: relayerFeePercentage,
        hadAutoVotingEnabled,
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
        <Skeleton asChild loading={isLoading}>
          <Text textStyle={{ base: "sm", md: "2xl" }} lineClamp={1}>
            <Mark variant="text" fontWeight="semibold">
              {potentialReward ? Number(formatEther(potentialReward.netTotal)).toFixed(2) : "-"}
            </Mark>
            {potentialReward && " B3TR"}
          </Text>
        </Skeleton>
      }
    />
  )
}
