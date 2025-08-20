import { useCallClause, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { X2EarnRewardsPool__factory } from "@vechain/vebetterdao-contracts"
import { ethers } from "ethers"
import { FormattingUtils } from "@repo/utils"

const abi = X2EarnRewardsPool__factory.abi
const address = getConfig().x2EarnRewardsPoolContractAddress
const method = "availableFunds" as const

export const getAppAvailableFundsQueryKey = (xAppId: string) =>
  getCallClauseQueryKeyWithArgs({ abi, address, method, args: [xAppId as `0x${string}`] })

/**
 * Get the available funds to withdraw in the x2Earn rewards pool contract
 *
 * @param thor  the connex instance
 * @param xAppId  the xApp id
 * @returns the available funds to withdraw in the x2Earn rewards pool contract.
 */
export const useAppAvailableFunds = (xAppId: string) => {
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
