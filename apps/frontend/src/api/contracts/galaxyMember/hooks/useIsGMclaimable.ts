import { useWallet } from "@vechain/vechain-kit"

import { useGMbalance } from "./useGMbalance"
import { useParticipatedInGovernance } from "./useParticipatedInGovernance"

/**
 * Returns whether the user can claim a GM NFT
 * @returns Whether the user can claim a GM NFT
 */
export const useIsGMclaimable = (profile?: string) => {
  const { account } = useWallet()
  const { data: hasVoted } = useParticipatedInGovernance(profile ?? account?.address ?? "")
  const { data: nftBalance } = useGMbalance(profile ?? account?.address ?? "")
  if (Number(nftBalance) > 0) return { isClaimable: false, isOwned: true }
  if (hasVoted === true) return { isClaimable: true, isOwned: false }
  return { isClaimable: false, isOwned: false }
}
