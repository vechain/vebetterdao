import { getConfig } from "@repo/config"
import { X2EarnCreator__factory } from "@vechain/vebetterdao-contracts/typechain-types"
import { useCallClause, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"

const address = getConfig().x2EarnCreatorContractAddress as `0x${string}`
const abi = X2EarnCreator__factory.abi
const method = "balanceOf" as const

export const getCreatorNftBalanceQueryKey = (walletAddress?: string) => {
  return getCallClauseQueryKeyWithArgs({ abi, address, method, args: [(walletAddress ?? "0x") as `0x${string}`] })
}

/**
 * Returns the number of Creator NFTs owned by the wallet.
 * Used with creatorApps to compute app submissions available (balance - creatorApps).
 */
export const useCreatorNftBalance = (walletAddress: string) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [(walletAddress ?? "0x") as `0x${string}`],
    queryOptions: {
      enabled: !!walletAddress,
      select: data => Number(data[0]),
    },
  })
}
