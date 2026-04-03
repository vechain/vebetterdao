import { getConfig } from "@repo/config"
import { NavigatorRegistry__factory } from "@vechain/vebetterdao-contracts"
import { getCallClauseQueryKeyWithArgs, useCallClause } from "@vechain/vechain-kit"
import { formatEther } from "ethers"

const address = getConfig().navigatorRegistryContractAddress as `0x${string}`
const abi = NavigatorRegistry__factory.abi
const method = "getStake" as const

export const getGetStakeQueryKey = (navigator: string) =>
  getCallClauseQueryKeyWithArgs({ abi, address, method, args: [navigator as `0x${string}`] })

export const useGetStake = (navigator: string) =>
  useCallClause({
    abi,
    address,
    method,
    args: [navigator as `0x${string}`],
    queryOptions: {
      enabled: !!navigator && !!address,
      select: data => ({
        raw: data[0] as bigint,
        scaled: formatEther(data[0] as bigint),
      }),
    },
  })
