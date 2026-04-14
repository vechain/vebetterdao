import { getConfig } from "@repo/config"
import { keepPreviousData } from "@tanstack/react-query"
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
      placeholderData: keepPreviousData,
      select: data => {
        const raw = (data?.[0] as bigint) ?? 0n
        return { raw, scaled: formatEther(raw) }
      },
    },
  })
