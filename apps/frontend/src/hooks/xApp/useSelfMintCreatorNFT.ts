import { getConfig } from "@repo/config"
import { X2EarnCreator__factory } from "@vechain/vebetterdao-contracts/typechain-types"
import { EnhancedClause, useWallet } from "@vechain/vechain-kit"
import { useCallback, useMemo } from "react"

import { getHasCreatorNFTQueryKey } from "@/api/contracts/x2EarnCreator/useHasCreatorNft"
import { buildClause } from "@/utils/buildClause"

import { useBuildTransaction } from "../useBuildTransaction"

const X2EarnCreatorInterface = X2EarnCreator__factory.createInterface()

type Props = {
  onSuccess?: () => void
  onFailure?: () => void
}

export const useSelfMintCreatorNFT = ({ onSuccess, onFailure }: Props) => {
  const { account } = useWallet()

  const buildSelfMintClause = useCallback(() => {
    return [
      buildClause({
        to: getConfig().x2EarnCreatorContractAddress,
        contractInterface: X2EarnCreatorInterface,
        method: "selfMint",
        args: [],
        comment: "Mint Creator NFT",
      }),
    ] as EnhancedClause[]
  }, [])

  const refetchQueryKeys = useMemo(() => {
    return [getHasCreatorNFTQueryKey(account?.address ?? "")]
  }, [account?.address])

  return useBuildTransaction({
    onSuccess,
    onFailure,
    clauseBuilder: buildSelfMintClause,
    refetchQueryKeys,
  })
}
