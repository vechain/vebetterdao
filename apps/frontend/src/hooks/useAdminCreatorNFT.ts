import { getHasCreatorNFTQueryKey } from "@/api/contracts/x2EarnCreator/useHasCreatorNft"
import { X2EarnCreator__factory } from "@vechain/vebetterdao-contracts/typechain-types"
import { useWallet, EnhancedClause } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { useCallback, useMemo } from "react"
import { useBuildTransaction } from "./useBuildTransaction"
import { buildClause } from "@/utils/buildClause"

const X2EarnCreatorNftInterface = X2EarnCreator__factory.createInterface()

type Props = { walletAddress: string; tokenId: string; onSuccess?: () => void; invalidateCache?: boolean }

/**
 *  Hook to mint or burn creator NFT
 * @param walletAddress address of the wallet
 * @param tokenId ID of the token
 * @param onSuccess callback function to be called after a successful transaction
 * @returns see {@link UseSendTransactionReturnValue}
 */
export const useAdminCreatorNFT = ({ walletAddress, tokenId, onSuccess }: Props) => {
  const { account: signerAccount } = useWallet()

  const buildMintClause = useCallback(() => {
    return [
      buildClause({
        to: getConfig().x2EarnCreatorContractAddress,
        contractInterface: X2EarnCreatorNftInterface,
        method: "safeMint",
        args: [walletAddress],
        comment: `Mint Creator NFT for ${walletAddress}`,
      }),
    ] as EnhancedClause[]
  }, [walletAddress])

  const buildBurnClause = useCallback(() => {
    return [
      buildClause({
        to: getConfig().x2EarnCreatorContractAddress,
        contractInterface: X2EarnCreatorNftInterface,
        method: "burn",
        args: [tokenId],
        comment: `Burn Creator NFT with ID ${tokenId}`,
      }),
    ] as EnhancedClause[]
  }, [tokenId])

  const refetchQueryKeys = useMemo(() => {
    return [getHasCreatorNFTQueryKey(walletAddress), getHasCreatorNFTQueryKey(signerAccount?.address ?? "")]
  }, [walletAddress, signerAccount])

  const mintNFT = useBuildTransaction({
    onSuccess,
    clauseBuilder: buildMintClause,
    refetchQueryKeys,
  })

  const burnNFT = useBuildTransaction({
    onSuccess,
    clauseBuilder: buildBurnClause,
    refetchQueryKeys,
  })

  return {
    mintNFT: { ...mintNFT },
    burnNFT: { ...burnNFT },
  }
}
