import { getConfig } from "@repo/config"
import { NavigatorRegistry__factory } from "@vechain/vebetterdao-contracts"
import { B3TRGovernor__factory } from "@vechain/vebetterdao-contracts/factories/governance/B3TRGovernor__factory"
import { VOT3__factory } from "@vechain/vebetterdao-contracts/factories/VOT3__factory"
import { useMultipleClausesCall, useThor } from "@vechain/vechain-kit"
import { formatEther, ZeroAddress } from "ethers"
import { useMemo } from "react"

import { useBestBlockCompressed } from "@/hooks/useGetBestBlockCompressed"

const navigatorRegistryAbi = NavigatorRegistry__factory.abi
const navigatorRegistryAddress = getConfig().navigatorRegistryContractAddress as `0x${string}`

const vot3Abi = VOT3__factory.abi
const vot3Address = getConfig().vot3ContractAddress as `0x${string}`

const governorAbi = B3TRGovernor__factory.abi
const governorAddress = getConfig().b3trGovernorAddress as `0x${string}`

export const CURRENT_EFFECTIVE_VOTES_PREFIX = "currentEffectiveVotes"
export const getCurrentEffectiveVotesPrefixQueryKey = () => [CURRENT_EFFECTIVE_VOTES_PREFIX]

// Mirrors XAllocationVoting.getVotes (VotesUtils.getVotes) but composed from current-state
// reads. Avoids the bestBlock-1 workaround required by VOT3.getPastVotes (which reverts on
// timepoint >= block.number), so the user's voting power updates instantly after a tx —
// no need to wait for a new block.
//
// VOT3.getVotes (no timepoint) and NavigatorRegistry.getDelegatedAmount/getNavigator return
// current state directly. B3TRGovernor.getDepositVotingPower and
// NavigatorRegistry.getStakedAmountAtTimepoint use upperLookupRecent (no future-lookup
// revert), so passing bestBlock returns the latest checkpoint <= bestBlock, which includes
// any state change mined at bestBlock.
export const useGetCurrentEffectiveVotes = (userAddress?: string) => {
  const thor = useThor()
  const { data: bestBlock } = useBestBlockCompressed()

  const addr = (userAddress ?? "") as `0x${string}`
  const blockNumber = bestBlock?.number ? BigInt(bestBlock.number) : 0n

  const query = useMultipleClausesCall({
    thor,
    queryKey: [CURRENT_EFFECTIVE_VOTES_PREFIX, userAddress ?? "", blockNumber.toString()],
    calls: [
      { abi: vot3Abi, address: vot3Address, functionName: "getVotes" as const, args: [addr] },
      {
        abi: navigatorRegistryAbi,
        address: navigatorRegistryAddress,
        functionName: "getNavigator" as const,
        args: [addr],
      },
      {
        abi: navigatorRegistryAbi,
        address: navigatorRegistryAddress,
        functionName: "getDelegatedAmount" as const,
        args: [addr],
      },
      {
        abi: governorAbi,
        address: governorAddress,
        functionName: "getDepositVotingPower" as const,
        args: [addr, blockNumber],
      },
      {
        abi: navigatorRegistryAbi,
        address: navigatorRegistryAddress,
        functionName: "getStakedAmountAtTimepoint" as const,
        args: [addr, blockNumber],
      },
    ],
    enabled: !!thor && !!userAddress && !!bestBlock?.number,
  })

  const data = useMemo(() => {
    if (!query.data) return undefined
    const [vot3Votes, navigator, delegated, deposits, staked] = query.data as [bigint, string, bigint, bigint, bigint]

    const isDelegated = navigator !== ZeroAddress
    const totalRaw = isDelegated ? delegated : vot3Votes + deposits + staked

    return {
      raw: totalRaw,
      scaled: formatEther(totalRaw),
      depositsRaw: deposits,
      depositsScaled: formatEther(deposits),
    }
  }, [query.data])

  return {
    ...query,
    data,
  }
}
