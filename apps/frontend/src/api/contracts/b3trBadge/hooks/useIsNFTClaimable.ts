import { useWallet } from "@vechain/dapp-kit-react"
import { useParticipatedInGovernance } from "./useParticipatedInGovernance"
import { useB3trBadgeBalance } from "./useB3trBadgeBalance"

/**
 * Returns whether the user can claim an NFT
 * @returns Whether the user can claim an NFT
 */

export const useIsNFTClaimable = () => {
  const { account } = useWallet()
  const {
    data: hasVoted,
    isLoading: isLoadingHasVoted,
    isError: isErrorHasVoted,
  } = useParticipatedInGovernance(account)

  const { data: nftBalance, isLoading: isLoadingNftBalance, isError: isErrorNftBalance } = useB3trBadgeBalance(account)
  if (isLoadingHasVoted || isErrorHasVoted || !hasVoted) return { isClaimable: false, isOwned: false }
  if (isLoadingNftBalance || isErrorNftBalance || nftBalance) return { isClaimable: false, isOwned: true }

  return { isClaimable: true, isOwned: false }
}
