import { getConfig } from "@repo/config"
import { XAllocationPool__factory } from "@vechain-kit/vebetterdao-contracts"
import { formatEther } from "viem"
import { getCallClauseQueryKeyWithArgs, useCallClause } from "@vechain/vechain-kit"

const abi = XAllocationPool__factory.abi
const address = getConfig().xAllocationPoolContractAddress as `0x${string}`
const method = "roundEarnings" as const

export const getXAppRoundEarningsQueryKey = (roundId: string | number, xAppId?: string) =>
  getCallClauseQueryKeyWithArgs({
    abi,
    address,
    method,
    args: [BigInt(roundId), xAppId as `0x${string}`],
  })

export const useXAppRoundEarnings = (roundId: string, xAppId: string) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [BigInt(roundId), xAppId as `0x${string}`],
    queryOptions: {
      enabled: !!roundId && !!xAppId,
      select: data => ({
        amount: formatEther(data[0]),
        appId: xAppId,
      }),
    },
  })
}
