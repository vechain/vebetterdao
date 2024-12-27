import { useSelectedGmNft, useParticipatedInGovernance } from "@/api"
import { useCallback } from "react"
import { useRouter } from "next/navigation"

export const useGmNFTState = (profile?: string) => {
  const { data: hasUserVoted } = useParticipatedInGovernance(profile ?? "")
  const { gmImage, gmName, gmLevel, gmRewardMultiplier, isGMLoading, isGMOwned, isXNodeAttachedToGM } =
    useSelectedGmNft(profile)

  const router = useRouter()
  const goToGmNftPage = useCallback(() => {
    router.push("/galaxy-member")
  }, [router])

  return {
    hasUserVoted,
    gmImage,
    gmName,
    gmLevel,
    gmRewardMultiplier,
    isGMLoading,
    isGMOwned,
    isXNodeAttachedToGM,
    goToGmNftPage,
  }
}
