import { getCurrentAllocationsRoundIdQueryKey, getAllocationsRoundsEventsQueryKey } from "@/api"
import { useCallback, useMemo } from "react"
import { EnhancedClause, currentBlockQueryKey } from "@vechain/vechain-kit"
import { Emissions__factory } from "@repo/contracts"
import { getConfig } from "@repo/config"
import { buildClause } from "@/utils/buildClause"
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
