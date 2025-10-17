import { useWallet } from "@vechain/vechain-kit"

import { useHasCreatorNFT } from "../../../api/contracts/x2EarnCreator/useHasCreatorNft"
import { useIsCreatorOfAnyApp } from "../../../api/contracts/xApps/hooks/useIsCreatorOfAnyApp"

import { CreatorApplyNow } from "./creatorBanners/CreatorApplyNow"

export const CreatorBanner = () => {
  const { account } = useWallet()
  const { data: hasCreatorNFT } = useHasCreatorNFT(account?.address ?? "") // No loading state
  const { data: hasAlreadySubmitted } = useIsCreatorOfAnyApp(account?.address ?? "")
  if (hasCreatorNFT || hasAlreadySubmitted) {
    return null
  }
  return <CreatorApplyNow />
}
