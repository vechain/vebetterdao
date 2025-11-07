"use client"

import { Card, VStack, Square, Icon, Text, Skeleton, Mark } from "@chakra-ui/react"
import { getConfig } from "@repo/config"
import { getCompactFormatter, humanNumber } from "@repo/utils/FormattingUtils"
import { VoterRewards__factory } from "@vechain/vebetterdao-contracts/factories/VoterRewards__factory"
import { useCallClause, useWallet } from "@vechain/vechain-kit"
import { useMemo } from "react"
import { formatEther } from "viem"

import { B3TRIcon } from "@/components/Icons/B3TRIcon"
import { calculatePotentialRewards } from "@/utils/rewardCalculation"

import type { AllocationCurrentRoundDetails } from "../page"

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
    queryOptions: {
      select: data => data[0],
    },
  })

  const { data: userGMWeight, isLoading: isUserGMWeightLoading } = useCallClause({
    abi: voterRewardsAbi,
    address: voterRewardsAddress,
    method: "getGMReward",
    args: [BigInt(id), account?.address as `0x{string}`],
    queryOptions: {
      select: data => data[0],
    },
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
    <Card.Root
      p="4"
      variant="subtle"
      bgColor="status.info.subtle"
      display="grid"
      gridTemplateColumns="2rem 1fr"
      columnGap="2"
      alignItems="center">
      <Square rounded="md" bgColor="status.info.subtle" aspectRatio={1} height="32px">
        <Icon boxSize="5" color="status.info.strong">
          <B3TRIcon />
        </Icon>
      </Square>
      <VStack flex={1} lineClamp={2} gap="1">
        <Text textStyle="xs" lineClamp={1}>
          {"Potential rewards"}
        </Text>
        {isLoading || !potentialReward ? (
          <Skeleton />
        ) : (
          <Text textStyle="sm" lineClamp={1}>
            <Mark variant="text" fontWeight="semibold">
              {getCompactFormatter().format(humanNumber(formatEther(potentialReward.netTotal)))}
            </Mark>
            {" B3TR"}
          </Text>
        )}
      </VStack>
    </Card.Root>
  )
}
