import { getConfig } from "@repo/config"
import { GalaxyMember__factory } from "@vechain-kit/vebetterdao-contracts"
import { useWallet, useCallClause, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"

const address = getConfig().galaxyMemberContractAddress
const abi = GalaxyMember__factory.abi
const method = "getSelectedTokenId" as const

export const getSelectedTokenIdQueryKey = (account?: string) =>
  getCallClauseQueryKeyWithArgs({ abi, address, method, args: [(account ?? "0x") as `0x${string}`] })

/**
 * Custom hook that retrieves the selected token ID for the selected galaxy member.
 *
 * @param enabled - Determines whether the hook is enabled or not. Default is true.
 * @returns The selected token ID for the galaxy member.
 */
export const useSelectedTokenId = (profile?: string, enabled = true) => {
  const { account } = useWallet()
  return useCallClause({
    abi,
    address,
    method,
    args: [(profile ?? account?.address ?? "") as `0x${string}`],
    queryOptions: {
      enabled: (!!profile || !!account?.address) && enabled,
      select: data => data[0].toString(),
    },
  })
}
