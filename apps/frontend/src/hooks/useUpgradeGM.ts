import { useCallback, useMemo } from "react"
import { GalaxyMember__factory } from "@repo/contracts"
import { getConfig } from "@repo/config"
import { useBuildTransaction } from "./useBuildTransaction"
import { buildClause } from "@/utils/buildClause"
import { getLevelOfTokenQueryKey } from "@/api"

const GalaxyMemberInterface = GalaxyMember__factory.createInterface()

type Props = { tokenId?: string; onSuccess?: () => void }

/**
 * Hook to upgrade a Galaxy Member NFT token
 * @param tokenId  the token id to upgrade
 * @param onSuccess  the callback to call after the token is upgraded
 * @returns the upgrade transaction
 */
export const useUpgradeGM = ({ tokenId, onSuccess }: Props) => {
  const clauseBuilder = useCallback(() => {
    return [
      buildClause({
        to: getConfig().galaxyMemberContractAddress,
        contractInterface: GalaxyMemberInterface,
        method: "upgrade",
        args: [tokenId],
        comment: `Upgrade Galaxy Member token ${tokenId}`,
      }),
    ]
  }, [tokenId])

  const refetchQueryKeys = useMemo(() => [getLevelOfTokenQueryKey(tokenId)], [tokenId])

  return useBuildTransaction({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
  })
}
