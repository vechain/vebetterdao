import { useWallet } from "@vechain/vechain-kit"
import { ZeroAddress } from "ethers"

import { compareAddresses } from "@/utils/AddressUtils/AddressUtils"

import { useVot3Delegates } from "../../api/contracts/vot3/hooks/useVot3Delegates"

export const useVot3RequireSelfDelegation = () => {
  const { account, connection } = useWallet()
  const { data: vot3DelegatedAddress } = useVot3Delegates(account?.address)
  const isDelegatedToZeroAddress = compareAddresses(vot3DelegatedAddress, ZeroAddress)
  return connection?.isConnectedWithPrivy && isDelegatedToZeroAddress
}
