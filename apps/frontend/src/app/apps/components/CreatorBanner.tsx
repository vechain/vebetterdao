import { useWallet } from "@vechain/vechain-kit"
import { CreatorApplyNow } from "./creatorBanners"
import { useHasCreatorNFT } from "@/api/contracts/x2EarnCreator"
import { useIsCreatorOfAnyApp } from "@/api/contracts/xApps"

export const CreatorBanner = () => {
  const { account } = useWallet()

  const { data: hasCreatorNFT } = useHasCreatorNFT(account?.address ?? "") // No loading state
  const { data: hasAlreadySubmitted } = useIsCreatorOfAnyApp(account?.address ?? "")

  if (hasCreatorNFT || hasAlreadySubmitted) {
    return null
  }

  return <CreatorApplyNow />
}
