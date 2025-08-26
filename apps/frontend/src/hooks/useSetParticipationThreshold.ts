import { useCallback, useMemo } from "react"
import { VeBetterPassport__factory } from "@vechain/vebetterdao-contracts"
import { getConfig } from "@repo/config"
import { getParticipationScoreThresholdQueryKey } from "@/api"
import { buildClause } from "@/utils/buildClause"
import { useBuildTransaction } from "./useBuildTransaction"

const VeBetterPassportInterface = VeBetterPassport__factory.createInterface()

const VE_BETTER_PASSPORT_ADDRESS = getConfig().veBetterPassportContractAddress

type Props = {
  participationThreshold: number
  onSuccess?: () => void
  invalidateCache?: boolean
  onSuccessMessageTitle?: string
}

/**
 * Set the participation threshold in the VeBetterPassport contract
 *
 * @param {number} props.participationThreshold - the new participation threshold
 * @returns the return value of the send transaction hook and the result of the transaction
 */
export const useSetParticipationThreshold = ({ participationThreshold, onSuccess }: Props) => {
  const clauseBuilder = useCallback(() => {
    const clauses = buildClause({
      contractInterface: VeBetterPassportInterface,
      to: VE_BETTER_PASSPORT_ADDRESS,
      method: "setThresholdPoPScore",
      args: [participationThreshold],
      comment: `Set participation threshold to ${participationThreshold}`,
    })

    return [clauses]
  }, [participationThreshold])

  const refetchQueryKeys = useMemo(() => [getParticipationScoreThresholdQueryKey()], [])

  return useBuildTransaction({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
  })
}
