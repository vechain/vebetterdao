import { useWallet } from "@vechain/dapp-kit-react"
import { useParticipatedInGovernance } from "./useParticipatedInGovernance"
import { useB3trBadgeBalance } from "./useB3trBadgeBalance"

export const useIsNFTClaimable = () => {
  const { account } = useWallet()
  const {
    data: hasVoted,
    isLoading: isLoadingHasVoted,
    isError: isErrorHasVoted,
  } = useParticipatedInGovernance(account)

  const { data: nftBalance, isLoading: isLoadingNftBalance, isError: isErrorNftBalance } = useB3trBadgeBalance(account)
  if (isLoadingHasVoted || isErrorHasVoted || !hasVoted) return false
  if (isLoadingNftBalance || isErrorNftBalance || nftBalance) return false

  return true
}
