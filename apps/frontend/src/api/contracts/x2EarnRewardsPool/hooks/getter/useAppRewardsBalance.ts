import { useCallClause, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { X2EarnRewardsPool__factory } from "@repo/contracts"
import { ethers } from "ethers"
import { FormattingUtils } from "@repo/utils"

const abi = X2EarnRewardsPool__factory.abi
const address = getConfig().x2EarnRewardsPoolContractAddress
const method = "rewardsPoolBalance" as const

export const getAppRewardsBalanceQueryKey = (xAppId: string) =>
  getCallClauseQueryKeyWithArgs({ abi, address, method, args: [xAppId as `0x${string}`] })

/**
 * Get the rewards balance in the x2Earn rewards pool contract
 *
 * @param xAppId  the xApp id
 * @returns the rewards balance in the x2Earn rewards pool contract.
 */
export const useAppRewardsBalance = (xAppId: string) => {
  return useCallClause({
    address,
    abi,
    method,
    args: [xAppId as `0x${string}`],
    queryOptions: {
      enabled: !!xAppId,
      select: data => {
        const original = data[0]
        const scaled = ethers.formatEther(original)
        const formatted = scaled === "0" ? "0" : FormattingUtils.humanNumber(scaled)
        return {
          original,
          scaled,
          formatted,
        }
      },
    },
  })
}
