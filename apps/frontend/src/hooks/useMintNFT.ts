import { getConfig } from "@repo/config"
import { GalaxyMember__factory } from "@vechain/vebetterdao-contracts"
import { useWallet } from "@vechain/vechain-kit"
import { useCallback, useMemo } from "react"

import { getSelectedTokenIdQueryKey } from "@/api/contracts/galaxyMember/hooks/useSelectedTokenId"
import { TransactionCustomUI } from "@/providers/TransactionModalProvider"
import { buildClause } from "@/utils/buildClause"

import { getUserGMsQueryKey } from "../api/contracts/galaxyMember/hooks/useGetUserGMs"
import { getGMbalanceQueryKey } from "../api/contracts/galaxyMember/hooks/useGMbalance"
import { getTokenIdByAccountQueryKey } from "../api/contracts/galaxyMember/hooks/useTokenIdByAccount"

import { useBuildTransaction } from "./useBuildTransaction"

const GalaxyMemberInterface = GalaxyMember__factory.createInterface()
type useMintNFTProps = {
  onFailure?: () => void
  onSuccess?: () => void
  invalidateCache?: boolean
  transactionModalCustomUI?: TransactionCustomUI
}
/**
 * Hook to mint an NFT
 * @param onSuccess callback to call when the NFT is successfully minted
 * @param onFailure callback to call when the NFT is failed or cancelled
 * @returns the result of the transaction
 */
export const useMintNFT = ({ onFailure, onSuccess, transactionModalCustomUI }: useMintNFTProps) => {
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
      getSelectedTokenIdQueryKey(account?.address),
      getTokenIdByAccountQueryKey(account?.address ?? "", 0),
      getGMbalanceQueryKey(account?.address ?? ""),
      getUserGMsQueryKey(account?.address ?? ""),
    ],
    [account?.address],
  )

  const handleOnFailure = useCallback(() => {
    onFailure?.()
  }, [onFailure])

  return useBuildTransaction({
    clauseBuilder,
    refetchQueryKeys,
    onFailure: handleOnFailure,
    onSuccess,
    transactionModalCustomUI,
  })
}
