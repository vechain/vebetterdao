import { getConfig } from "@repo/config"
import { Emissions__factory } from "@vechain/vebetterdao-contracts"
import { EnhancedClause, currentBlockQueryKey } from "@vechain/vechain-kit"
import { useCallback, useMemo } from "react"

import { buildClause } from "@/utils/buildClause"

import { getAllocationsRoundsEventsQueryKey } from "../api/contracts/xAllocations/hooks/useAllocationsRoundsEvents"
import { getCurrentAllocationsRoundIdQueryKey } from "../api/contracts/xAllocations/hooks/useCurrentAllocationsRoundId"

import { useBuildTransaction } from "./useBuildTransaction"

const EmissionsInterface = Emissions__factory.createInterface()
type useStartEmissionsProps = {
  onSuccess?: () => void
}
/**
 * Hook to start the emissions
 * @param onSuccess callback to run when the upgrade is successful
 */
export const useStartEmission = ({ onSuccess }: useStartEmissionsProps) => {
  const clauseBuilder = useCallback(() => {
    const clauses: EnhancedClause[] = [
      buildClause({
        to: getConfig().emissionsContractAddress,
        contractInterface: EmissionsInterface,
        method: "start",
        args: [],
        comment: "Start emissions",
      }),
    ]
    return clauses
  }, [])
  const refetchQueryKeys = useMemo(
    () => [getCurrentAllocationsRoundIdQueryKey(), getAllocationsRoundsEventsQueryKey(), currentBlockQueryKey()],
    [],
  )
  return useBuildTransaction({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
  })
}
