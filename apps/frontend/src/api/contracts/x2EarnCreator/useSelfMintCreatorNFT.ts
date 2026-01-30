import { getConfig } from "@repo/config"
import { EnhancedClause, useWallet } from "@vechain/vechain-kit"
import { Interface } from "ethers"
import { useCallback, useMemo } from "react"

import { getHasCreatorNFTQueryKey } from "@/api/contracts/x2EarnCreator/useHasCreatorNft"
import { useBuildTransaction } from "@/hooks/useBuildTransaction"
import { buildClause } from "@/utils/buildClause"

const selfMintInterface = new Interface(["function selfMint()"])

export const useSelfMintCreatorNFT = ({
  onSuccess,
  onFailure,
}: { onSuccess?: () => void; onFailure?: () => void } = {}) => {
  const { account } = useWallet()

  const buildSelfMintClause = useCallback(() => {
    return [
      buildClause({
        to: getConfig().x2EarnCreatorContractAddress,
        contractInterface: selfMintInterface,
        method: "selfMint",
        args: [],
        comment: "Self-mint Creator NFT",
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
