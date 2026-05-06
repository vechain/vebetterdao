"use client"

import { Text, Skeleton, Mark } from "@chakra-ui/react"
import { getConfig } from "@repo/config"
import { NavigatorRegistry__factory } from "@vechain/vebetterdao-contracts"
import { Emissions__factory } from "@vechain/vebetterdao-contracts/factories/Emissions__factory"
import { RelayerRewardsPool__factory } from "@vechain/vebetterdao-contracts/factories/RelayerRewardsPool__factory"
import { VoterRewards__factory } from "@vechain/vebetterdao-contracts/factories/VoterRewards__factory"
import { XAllocationVoting__factory } from "@vechain/vebetterdao-contracts/factories/x-allocation-voting-governance/XAllocationVoting__factory"
import { useCallClause, useMultipleClausesCall, useThor, useWallet } from "@vechain/vechain-kit"
import { Gift } from "iconoir-react"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { formatEther } from "viem"

import { useHasVotedInProposals } from "@/api/contracts/governance/hooks/useHasVotedInProposals"
import { useAllocationsRound } from "@/api/contracts/xAllocations/hooks/useAllocationsRound"
import { useFilteredProposals } from "@/app/proposals/hooks/useFilteredProposals"
import { useProposalEnriched } from "@/hooks/proposals/common/useProposalEnriched"
import { useBreakpoints } from "@/hooks/useBreakpoints"
import { useEvents } from "@/hooks/useEvents"
import { ProposalFilter } from "@/store/useProposalFilters"
import { calculatePotentialRewards } from "@/utils/rewardCalculation"

import { PotentialRewardsBottomSheet } from "./PotentialRewardsBottomSheet"
import { StatCard } from "./StatCard"

const voterRewardsAbi = VoterRewards__factory.abi
const voterRewardsAddress = getConfig().voterRewardsContractAddress as `0x${string}`

const emissionsAbi = Emissions__factory.abi
const emissionsAddress = getConfig().emissionsContractAddress as `0x${string}`

const xAllocationVotingAbi = XAllocationVoting__factory.abi
const xAllocationVotingAddress = getConfig().xAllocationVotingContractAddress as `0x${string}`

const relayerRewardsAbi = RelayerRewardsPool__factory.abi
const relayerRewardsAddress = getConfig().relayerRewardsPoolContractAddress as `0x${string}`

const navigatorRegistryAbi = NavigatorRegistry__factory.abi
const navigatorRegistryAddress = getConfig().navigatorRegistryContractAddress as `0x${string}`

export const PotentialRewardBox = () => {
  const { account } = useWallet()
  const thor = useThor()
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const onClose = useCallback(() => setIsOpen(false), [])
  const { isMobile } = useBreakpoints()

  const { data: currentRoundId } = useCallClause({
    abi: xAllocationVotingAbi,
    address: xAllocationVotingAddress,
    method: "currentRoundId" as const,
    args: [],
    queryOptions: { select: data => data[0] },
  })

  const { data: roundData } = useAllocationsRound(currentRoundId?.toString())

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
        functionName: "cycleToVoterToGMWeight" as const,
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
      {
        abi: relayerRewardsAbi,
        address: relayerRewardsAddress,
        functionName: "getFeeCap" as const,
        args: [],
      },
      {
        abi: navigatorRegistryAbi,
        address: navigatorRegistryAddress,
        functionName: "isDelegated" as const,
        args: [(account?.address || "") as `0x${string}`],
      },
      {
        abi: navigatorRegistryAbi,
        address: navigatorRegistryAddress,
        functionName: "getFeePercentage" as const,
        args: [],
      },
    ],
    enabled: !!thor && !!currentRoundId,
  })

  const { data: freshnessEvents } = useEvents({
    abi: xAllocationVotingAbi,
    contractAddress: xAllocationVotingAddress,
    eventName: "FreshnessMultiplierApplied",
    filterParams: {
      voter: (account?.address ?? "") as `0x${string}`,
      roundId: currentRoundId!,
    },
    select: events => events.map(({ decodedData }) => Number(decodedData.args.multiplier)),
    enabled: !!account?.address && !!currentRoundId,
  })

  const freshnessLabel = useMemo(() => {
    const multiplier = freshnessEvents?.[0]
    if (!multiplier) return null
    return `x${multiplier / 10000}`
  }, [freshnessEvents])

  const { data: { enrichedProposals } = { enrichedProposals: [] } } = useProposalEnriched()
  const { filteredProposals: activeProposals } = useFilteredProposals([ProposalFilter.InThisRound], enrichedProposals)
  const { data: hasVotedInProposals } = useHasVotedInProposals(
    activeProposals?.map(p => p?.id),
    account?.address ?? undefined,
  )

  const unvotedProposalCount = useMemo(() => {
    if (!hasVotedInProposals || !activeProposals?.length) return 0
    return activeProposals.filter(p => !hasVotedInProposals[p.id]).length
  }, [activeProposals, hasVotedInProposals])

  const {
    potentialReward,
    hasVoted,
    hasGmNft,
    hadAutoVotingEnabled,
    relayerFeePercentage,
    isDelegating,
    navigatorFeePercentage,
  } = useMemo(() => {
    if (data) {
      const [
        cycleTotal,
        cycleTotalGMWeight,
        userVoterTotal,
        userGMWeight,
        [_xAllocationsAmount, vote2EarnAmount, _treasuryAmount, gmAmount],
        relayerFee,
        autoVotingEnabled = false,
        feeCap,
        isDelegatedResult = false,
        navFeePercentage = 0n,
      ] = data

      return {
        potentialReward: calculatePotentialRewards({
          voterTotal: userVoterTotal,
          cycleTotal: cycleTotal,
          vote2EarnAmount,
          gmEmissionsAmount: gmAmount,
          gmWeightTotal: userGMWeight,
          cycleGMTotal: cycleTotalGMWeight,
          relayerFeePercentage: relayerFee,
          feeCap: feeCap as bigint,
          hadAutoVotingEnabled: autoVotingEnabled,
          isDelegating: isDelegatedResult as boolean,
          navigatorFeePercentage: navFeePercentage as bigint,
        }),
        hasVoted: userVoterTotal > 0n,
        hasGmNft: userGMWeight > 0n,
        hadAutoVotingEnabled: autoVotingEnabled as boolean,
        relayerFeePercentage: relayerFee as bigint,
        isDelegating: isDelegatedResult as boolean,
        navigatorFeePercentage: navFeePercentage as bigint,
      }
    }

    return {
      potentialReward: null,
      hasVoted: false,
      hasGmNft: false,
      hadAutoVotingEnabled: false,
      relayerFeePercentage: 0n,
      isDelegating: false,
      navigatorFeePercentage: 0n,
    }
  }, [data])

  return (
    <>
      <StatCard
        variant="warning"
        title={t("Your rewards")}
        icon={isMobile ? undefined : <Gift />}
        onClick={() => setIsOpen(true)}
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
      <PotentialRewardsBottomSheet
        isOpen={isOpen}
        onClose={onClose}
        reward={potentialReward}
        currentRoundId={currentRoundId}
        hasVoted={hasVoted}
        hasGmNft={hasGmNft}
        hadAutoVotingEnabled={hadAutoVotingEnabled}
        relayerFeePercentage={relayerFeePercentage}
        unvotedProposalCount={unvotedProposalCount}
        totalProposalCount={activeProposals?.length ?? 0}
        roundEndTimestamp={roundData?.voteEndTimestamp ?? null}
        isDelegating={isDelegating}
        navigatorFeePercentage={navigatorFeePercentage}
        freshnessLabel={freshnessLabel}
      />
    </>
  )
}
