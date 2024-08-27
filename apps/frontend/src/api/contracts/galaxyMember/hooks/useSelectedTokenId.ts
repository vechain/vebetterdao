import { getConfig } from "@repo/config"
import { useWallet } from "@vechain/dapp-kit-react"
import { GalaxyMember__factory } from "@repo/contracts"
import { useCall } from "@/hooks"

const contractAddress = getConfig().galaxyMemberContractAddress
const contractInterface = GalaxyMember__factory.createInterface()
const method = "getSelectedTokenId"

/**
 * Custom hook that retrieves the selected token ID for the selected galaxy member.
 *
 * @param enabled - Determines whether the hook is enabled or not. Default is true.
 * @returns The selected token ID for the galaxy member.
 */
export const useSelectedTokenId = (enabled = true) => {
  const { account } = useWallet()
  return useCall({
    contractInterface,
    contractAddress,
    method,
    args: [account],
    enabled: !!account && enabled,
  })
}
