import { useCallback } from "react"
import { getConfig } from "@repo/config"
import { X2EarnCreator__factory } from "@repo/contracts/typechain-types"
import { useQueryClient } from "@tanstack/react-query"
import { EnhancedClause, useSendTransaction, UseSendTransactionReturnValue } from "./useSendTransaction"
import { getHasCreatorNFTQueryKey } from "@/api/contracts/x2EarnCreator/hooks"
import { useWallet } from "@vechain/dapp-kit-react"

const X2EarnCreatorNftInterface = X2EarnCreator__factory.createInterface()

type Props = { walletAddress: string; tokenId: string; onSuccess?: () => void; invalidateCache?: boolean }

/**
 *  Hook to mint or burn creator NFT
 * @param walletAddress address of the wallet
 * @param tokenId ID of the token
 * @param onSuccess callback function to be called after a successful transaction
 * @param invalidateCache boolean to determine if cache should be invalidated after a successful transaction
 * @returns see {@link UseSendTransactionReturnValue}
 */
export const useAdminCreatorNFT = ({ walletAddress, tokenId, onSuccess, invalidateCache = true }: Props) => {
  const { account: signerAccount } = useWallet()
  const queryClient = useQueryClient()

  const buildMintClause = useCallback(() => {
    return [
      {
        to: getConfig().x2EarnCreatorContractAddress,
        value: 0,
        data: X2EarnCreatorNftInterface.encodeFunctionData("safeMint", [walletAddress]),
        abi: JSON.parse(JSON.stringify(X2EarnCreatorNftInterface.getFunction("safeMint"))),
        comment: `Mint Creator NFT for ${walletAddress}`,
      },
    ] as EnhancedClause[]
  }, [walletAddress])

  const buildBurnClause = useCallback(() => {
    return [
      {
        to: getConfig().x2EarnCreatorContractAddress,
        value: 0,
        data: X2EarnCreatorNftInterface.encodeFunctionData("burn", [tokenId]),
        abi: JSON.parse(JSON.stringify(X2EarnCreatorNftInterface.getFunction("burn"))),
        comment: `Burn Creator NFT with ID ${tokenId}`,
      },
    ] as EnhancedClause[]
  }, [tokenId])

  const performCacheInvalidation = useCallback(async () => {
    if (invalidateCache && walletAddress) {
      await queryClient.cancelQueries({
        queryKey: getHasCreatorNFTQueryKey(walletAddress),
      })
      await queryClient.refetchQueries({
        queryKey: getHasCreatorNFTQueryKey(walletAddress),
      })
    }
  }, [invalidateCache, queryClient, tokenId, walletAddress])

  const handleOnSuccess = useCallback(async () => {
    await performCacheInvalidation()
    onSuccess?.()
  }, [performCacheInvalidation, onSuccess])

  const mintNFT: UseSendTransactionReturnValue = useSendTransaction({
    signerAccount,
    onTxConfirmed: handleOnSuccess,
  })

  const burnNFT: UseSendTransactionReturnValue = useSendTransaction({
    signerAccount,
    onTxConfirmed: handleOnSuccess,
  })

  const onMutateMintNFT = useCallback(async () => {
    const clauses = buildMintClause()
    return mintNFT.sendTransaction(clauses)
  }, [buildMintClause, mintNFT])

  const onMutateBurnNFT = useCallback(async () => {
    const clauses = buildBurnClause()
    return burnNFT.sendTransaction(clauses)
  }, [buildBurnClause, burnNFT])

  return {
    mintNFT: { ...mintNFT, sendTransaction: onMutateMintNFT },
    burnNFT: { ...burnNFT, sendTransaction: onMutateBurnNFT },
  }
}
