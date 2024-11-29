import { compareAddresses } from "@repo/utils/AddressUtils"
import { useWallet } from "@vechain/dapp-kit-react"

export const useIsUserConnectedProfil = (address: string) => {
  const { account } = useWallet()
  return compareAddresses(account ?? "", address)
}
