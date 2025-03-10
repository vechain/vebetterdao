import { useVot3Delegates } from "@/api"
import { compareAddresses } from "@/utils/AddressUtils/AddressUtils"
import { useWallet } from "@vechain/vechain-kit"
import { ZeroAddress } from "ethers"

export const useVot3RequireSelfDelegation = () => {
  const { account, connection } = useWallet()

  const { data: vot3DelegatedAddress } = useVot3Delegates(account?.address)

  const isDelegatedToZeroAddress = compareAddresses(vot3DelegatedAddress, ZeroAddress)

  return connection.isConnectedWithPrivy && isDelegatedToZeroAddress
}
