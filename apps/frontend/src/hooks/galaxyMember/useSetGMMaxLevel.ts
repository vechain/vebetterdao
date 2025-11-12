import { getConfig } from "@repo/config"
import { GalaxyMember__factory } from "@vechain/vebetterdao-contracts/factories/GalaxyMember__factory"
import { useCallback } from "react"

import { getGMMaxLevelQueryKey } from "@/api/contracts/galaxyMember/hooks/useGMMaxLevel"
import { buildClause } from "@/utils/buildClause"

import { useBuildTransaction } from "../useBuildTransaction"

const GalaxyMemberInterface = GalaxyMember__factory.createInterface()
type Props = { maxLevel: number; onSuccess?: () => void }
/**
 * Hook to set the GM max level
 * @param maxLevel  the max level to set
 * @param onSuccess  the callback to call after the transaction is successful
 * @returns the set GM max level transaction
 */
export const useSetGMMaxLevel = ({ maxLevel, onSuccess }: Props) => {
  const clauseBuilder = useCallback(() => {
    return [
      buildClause({
        to: getConfig().galaxyMemberContractAddress,
        contractInterface: GalaxyMemberInterface,
        method: "setMaxLevel",
        args: [maxLevel],
        comment: `Setting GM max level to  ${maxLevel}`,
      }),
    ]
  }, [maxLevel])
  const refetchQueryKeys = [getGMMaxLevelQueryKey()]
  return useBuildTransaction({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
  })
}
