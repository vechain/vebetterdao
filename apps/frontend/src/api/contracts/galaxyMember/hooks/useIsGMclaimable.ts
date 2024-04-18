import { useWallet } from "@vechain/dapp-kit-react"
import { useParticipatedInGovernance } from "./useParticipatedInGovernance"
import { useGMbalance } from "./useGMbalance"

/**
 * Returns whether the user can claim a GM NFT
 * @returns Whether the user can claim a GM NFT
 */

export const useIsGMclaimable = () => {
  const { account } = useWallet()
  const {
    data: hasVoted,
    isLoading: isLoadingHasVoted,
    isError: isErrorHasVoted,
  } = useParticipatedInGovernance(account)

  const { data: nftBalance, isLoading: isLoadingNftBalance, isError: isErrorNftBalance } = useGMbalance(account)
  if (isLoadingHasVoted || isErrorHasVoted || !hasVoted) return { isClaimable: false, isOwned: false }
  if (isLoadingNftBalance || isErrorNftBalance || nftBalance) return { isClaimable: false, isOwned: true }

  return { isClaimable: true, isOwned: false }
}
