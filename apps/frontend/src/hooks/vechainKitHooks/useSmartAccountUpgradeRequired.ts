import { useWallet, useUpgradeRequired } from "@vechain/vechain-kit"

export const useSmartAccountUpgradeRequired = () => {
  const { smartAccount, connection, connectedWallet } = useWallet()

  const { data: isSmartAccountUpgradeRequired } = useUpgradeRequired(
    smartAccount?.address ?? "",
    connectedWallet?.address ?? "",
    3,
  )
  return connection?.isConnectedWithPrivy && isSmartAccountUpgradeRequired
}
