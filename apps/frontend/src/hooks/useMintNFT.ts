import { getGMbalanceQueryKey, getTokenIdByAccountQueryKey } from "@/api"
import { useBuildTransaction } from "./useBuildTransaction"
import { useCallback, useMemo } from "react"
import { useWallet } from "@vechain/dapp-kit-react"
import { getConfig } from "@repo/config"
import { GalaxyMember__factory } from "@repo/contracts"
import { getTokensInfoByOwnerQueryKey } from "@/api/contracts/galaxyMember/hooks/useGetTokensInfoByOwner"
import { buildClause } from "@/utils/buildClause"
import { getSelectedTokenIdQueryKey } from "@/api/contracts/galaxyMember/hooks/useSelectedTokenId"

const GalaxyMemberInterface = GalaxyMember__factory.createInterface()

type useMintNFTProps = {
  onFailure?: () => void
  onSuccess?: () => void
  invalidateCache?: boolean
}

/**
 * Hook to mint an NFT
 * @param onSuccess callback to call when the NFT is successfully minted
 * @param onFailure callback to call when the NFT is failed or cancelled
 * @returns the result of the transaction
 */
export const useMintNFT = ({ onFailure, onSuccess }: useMintNFTProps) => {
  const { account } = useWallet()
  const clauseBuilder = useCallback(() => {
    return [
      buildClause({
        to: getConfig().galaxyMemberContractAddress,
        contractInterface: GalaxyMemberInterface,
        method: "freeMint",
        args: [],
        comment: `Claim NFT`,
      }),
    ]
  }, [])

  const refetchQueryKeys = useMemo(
    () => [
      getSelectedTokenIdQueryKey(account),
      getTokenIdByAccountQueryKey(account),
      getGMbalanceQueryKey(account),
      getTokensInfoByOwnerQueryKey(account),
    ],
    [account],
  )

  const handleOnFailure = useCallback(() => {
    onFailure?.()
  }, [onFailure])

  const result = useBuildTransaction({
    clauseBuilder,
    refetchQueryKeys,
    onFailure: handleOnFailure,
    onSuccess,
  })

  return result
}
