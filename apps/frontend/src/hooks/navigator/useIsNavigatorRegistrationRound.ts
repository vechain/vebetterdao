import { getConfig } from "@repo/config"
import { NavigatorRegistry__factory } from "@vechain/vebetterdao-contracts"
import { useMemo } from "react"

import { useAllocationsRoundsEvents } from "@/api/contracts/xAllocations/hooks/useAllocationsRoundsEvents"
import { useCurrentAllocationsRoundId } from "@/api/contracts/xAllocations/hooks/useCurrentAllocationsRoundId"
import { useEvents } from "@/hooks/useEvents"

/**
 * Tasks begin the round AFTER registration. Returns true while the navigator is still in
 * the same round they registered in, so the UI can hide tasks/checklists for that round.
 */
export const useIsNavigatorRegistrationRound = (address?: string) => {
  const { data: roundId } = useCurrentAllocationsRoundId()
  const { data: roundsData } = useAllocationsRoundsEvents()
  const { data: registrationBlock } = useEvents({
    contractAddress: getConfig().navigatorRegistryContractAddress,
    abi: NavigatorRegistry__factory.abi,
    eventName: "NavigatorRegistered",
    filterParams: address ? { navigator: address as `0x${string}` } : undefined,
    select: events => events[0]?.meta.blockNumber ?? 0,
    enabled: !!address,
  })

  return useMemo(() => {
    if (!registrationBlock || !roundsData?.created?.length || !roundId) return false
    const currentRound = roundsData.created.find(r => r.roundId === roundId)
    if (!currentRound) return false
    return registrationBlock > Number(currentRound.voteStart)
  }, [registrationBlock, roundsData, roundId])
}
