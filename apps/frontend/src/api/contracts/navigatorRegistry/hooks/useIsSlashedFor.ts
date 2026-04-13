import { getConfig } from "@repo/config"
import { useQuery } from "@tanstack/react-query"
import { NavigatorRegistry__factory } from "@vechain/vebetterdao-contracts"
import { executeMultipleClausesCall, useThor } from "@vechain/vechain-kit"

import { type InfractionType, type ReportableInfraction } from "@/hooks/navigator/useReportNavigatorInfraction"

const abi = NavigatorRegistry__factory.abi
const address = getConfig().navigatorRegistryContractAddress as `0x${string}`

type SlashedResult = {
  missedAllocation: boolean
  missedGovernance: boolean
  stalePrefs: boolean
  missedReport: boolean
  latePrefs: boolean
}

const FIELD_MAP: Record<InfractionType, keyof SlashedResult> = {
  missedAllocationVote: "missedAllocation",
  missedGovernanceVote: "missedGovernance",
  stalePreferences: "stalePrefs",
  missedReport: "missedReport",
  latePreferences: "latePrefs",
}

export const useIsSlashedFor = (navigator: string, infractions: ReportableInfraction[]) => {
  const thor = useThor()

  const uniqueIds = [
    ...new Set(infractions.map(inf => (inf.type === "missedGovernanceVote" ? inf.proposalId! : inf.roundId))),
  ]

  return useQuery({
    queryKey: ["isSlashedFor", navigator, uniqueIds],
    queryFn: async () => {
      const results = await executeMultipleClausesCall({
        thor,
        calls: uniqueIds.map(
          id =>
            ({
              abi,
              address,
              functionName: "isSlashedFor" as const,
              args: [navigator as `0x${string}`, BigInt(id)],
            }) as const,
        ),
      })

      const slashedMap = new Map<string, SlashedResult>()
      uniqueIds.forEach((id, i) => {
        const r = results[i] as [boolean, boolean, boolean, boolean, boolean]
        slashedMap.set(id, {
          missedAllocation: r[0],
          missedGovernance: r[1],
          stalePrefs: r[2],
          missedReport: r[3],
          latePrefs: r[4],
        })
      })

      const reported = new Set<number>()
      infractions.forEach((inf, i) => {
        const id = inf.type === "missedGovernanceVote" ? inf.proposalId! : inf.roundId
        const entry = slashedMap.get(id)
        if (entry && entry[FIELD_MAP[inf.type]]) {
          reported.add(i)
        }
      })

      return reported
    },
    enabled: !!thor && !!navigator && !!address && infractions.length > 0 && uniqueIds.length > 0,
  })
}
