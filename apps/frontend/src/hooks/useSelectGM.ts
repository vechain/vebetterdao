import { getConfig } from "@repo/config"
import { GalaxyMember__factory } from "@vechain/vebetterdao-contracts"
import { useWallet } from "@vechain/vechain-kit"
import { useCallback, useMemo } from "react"

import { useBuildTransaction } from "./useBuildTransaction"

import { buildClause } from "@/utils/buildClause"
import { getUserGMsQueryKey } from "@/api/contracts/galaxyMember/hooks/useGetUserGMs"

const GalaxyMemberInterface = GalaxyMember__factory.createInterface()
type Props = { tokenId?: string; onSuccess?: () => void }
/**
 * Hook to select a Galaxy Member NFT token
 * @param tokenId  the token id to select
 * @param onSuccess  the callback to call after the token is selected
 * @returns the select transaction
 */
export const useSelectGM = ({ tokenId, onSuccess }: Props) => {
  const { account } = useWallet()
  const clauseBuilder = useCallback(() => {
    return [
      buildClause({
        to: getConfig().galaxyMemberContractAddress,
        contractInterface: GalaxyMemberInterface,
        method: "select",
        args: [tokenId],
        comment: `Select Galaxy Member token ${tokenId}`,
      }),
    ]
  }, [tokenId])
  const refetchQueryKeys = useMemo(() => [getUserGMsQueryKey(account?.address || "")], [account?.address])
  return useBuildTransaction({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
  })
}
