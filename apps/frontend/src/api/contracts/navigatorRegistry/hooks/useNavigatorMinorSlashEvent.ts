import { getConfig } from "@repo/config"
import { NavigatorRegistry__factory } from "@vechain/vebetterdao-contracts"
import { formatEther } from "ethers"

import { useEvents } from "@/hooks/useEvents"

const address = getConfig().navigatorRegistryContractAddress
const abi = NavigatorRegistry__factory.abi

export type NavigatorMinorSlashEvent = {
  amount: string
  remainingStake: string
  infractionFlags: number
}

/**
 * Returns all `NavigatorMinorSlashed` events for a navigator, indexed by `roundId`.
 *
 * Use this to read the actual amount slashed (and remaining stake) per round.
 * Computing `slashBps × currentStake` is wrong post-slash because the current
 * stake is already reduced — that estimate is only valid before the slash.
 *
 * `roundId` is not indexed on the event, so we filter on-chain by navigator
 * and bucket by round client-side.
 */
export const useNavigatorMinorSlashEventsByRound = (navigator?: string) => {
  return useEvents({
    contractAddress: address,
    abi,
    eventName: "NavigatorMinorSlashed",
    filterParams: navigator ? { navigator: navigator as `0x${string}` } : undefined,
    enabled: !!navigator,
    select: events => {
      const map = new Map<string, NavigatorMinorSlashEvent>()
      for (const e of events) {
        const roundId = String(e.decodedData.args.roundId ?? "")
        if (!roundId) continue
        map.set(roundId, {
          amount: formatEther(e.decodedData.args.amount ?? 0n),
          remainingStake: formatEther(e.decodedData.args.remainingStake ?? 0n),
          infractionFlags: Number(e.decodedData.args.infractionFlags ?? 0n),
        })
      }
      return map
    },
  })
}
