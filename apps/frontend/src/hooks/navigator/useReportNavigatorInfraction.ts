import { getConfig } from "@repo/config"
import { type QueryKey, useQueryClient } from "@tanstack/react-query"
import { NavigatorRegistry__factory } from "@vechain/vebetterdao-contracts"
import { useCallback, useMemo } from "react"

import { getGetStakeQueryKey } from "@/api/contracts/navigatorRegistry/hooks/useGetStake"
import { invalidateNavigatorStakeHistoryQueries } from "@/api/contracts/navigatorRegistry/hooks/useNavigatorStakeHistory"
import { invalidateNavigatorQueries } from "@/api/indexer/navigators/useNavigators"
import { buildClause } from "@/utils/buildClause"

import { useBuildTransaction } from "../useBuildTransaction"

const navigatorRegistryAddress = getConfig().navigatorRegistryContractAddress
const navigatorRegistryInterface = NavigatorRegistry__factory.createInterface()

export type InfractionType =
  | "missedAllocationVote"
  | "missedGovernanceVote"
  | "stalePreferences"
  | "missedReport"
  | "latePreferences"

export type ReportableInfraction = {
  type: InfractionType
  roundId: string
  voteEnd?: number
  proposalId?: string
  proposalTitle?: string
}

type ReportParams = {
  navigator: string
  roundId: string
  proposalIds: string[]
}

type Props = {
  onSuccess?: () => void
  additionalRefetchKeys?: QueryKey[]
  /** When set, also refreshes on-chain stake, indexer navigator stats (e.g. Total Staked), and stake history events */
  navigatorAddress?: string
}

export const useReportNavigatorInfraction = ({ onSuccess, additionalRefetchKeys = [], navigatorAddress }: Props) => {
  const queryClient = useQueryClient()

  const clauseBuilder = useCallback(({ navigator, roundId, proposalIds }: ReportParams) => {
    return [
      buildClause({
        to: navigatorRegistryAddress,
        contractInterface: navigatorRegistryInterface,
        method: "reportRoundInfractions",
        args: [navigator, BigInt(roundId), proposalIds.map(id => BigInt(id))],
        comment: "Report round infractions",
      }),
    ]
  }, [])

  const invalidateKeys = useMemo((): QueryKey[] => {
    const keys: QueryKey[] = [["isSlashedForRound"], ...additionalRefetchKeys]
    if (navigatorAddress) {
      keys.push(getGetStakeQueryKey(navigatorAddress))
    }
    return keys
  }, [additionalRefetchKeys, navigatorAddress])

  const handleSuccess = useCallback(() => {
    for (const queryKey of invalidateKeys) {
      void queryClient.invalidateQueries({ queryKey })
    }
    if (navigatorAddress) {
      invalidateNavigatorQueries(queryClient)
      invalidateNavigatorStakeHistoryQueries(queryClient)
    }
    onSuccess?.()
  }, [invalidateKeys, navigatorAddress, onSuccess, queryClient])

  return useBuildTransaction<ReportParams>({
    clauseBuilder,
    // resetQueries here clears cache before refetch — slashed/stake flicker to empty / false
    refetchQueryKeys: [],
    invalidateCache: false,
    onSuccess: handleSuccess,
  })
}
