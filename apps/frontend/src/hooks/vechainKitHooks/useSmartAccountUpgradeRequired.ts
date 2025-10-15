import { useWallet, useUpgradeRequired } from "@vechain/vechain-kit"

export const useSmartAccountUpgradeRequired = () => {
  const { smartAccount, connectedWallet } = useWallet()
  const { data: isSmartAccountUpgradeRequired } = useUpgradeRequired(
    smartAccount?.address ?? "",
    connectedWallet?.address ?? "",
    3, //Hardcoding the upgrade version for now, in the future if this is required vechain kit exposes the latest version on the useCurrentAccountImplementationVersion hook
  )
  return isSmartAccountUpgradeRequired
}
