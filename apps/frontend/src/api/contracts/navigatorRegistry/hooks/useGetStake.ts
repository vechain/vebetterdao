import { getConfig } from "@repo/config"
import { keepPreviousData } from "@tanstack/react-query"
import { NavigatorRegistry__factory } from "@vechain/vebetterdao-contracts"
import { getCallClauseQueryKeyWithArgs, useCallClause } from "@vechain/vechain-kit"
import { formatEther } from "ethers"

const address = getConfig().navigatorRegistryContractAddress as `0x${string}`
const abi = NavigatorRegistry__factory.abi
const method = "getStake" as const

// Callers mix casings (indexer/route params are lowercase, wallet addresses are checksummed),
// so normalize or the query key built here won't match the one invalidated after a stake tx.
const normalize = (navigator: string) => navigator.toLowerCase() as `0x${string}`

export const getGetStakeQueryKey = (navigator: string) =>
  getCallClauseQueryKeyWithArgs({ abi, address, method, args: [normalize(navigator)] })

export const useGetStake = (navigator: string) =>
  useCallClause({
    abi,
    address,
    method,
    args: [normalize(navigator)],
    queryOptions: {
      enabled: !!navigator && !!address,
      placeholderData: keepPreviousData,
      select: data => {
        const raw = (data?.[0] as bigint) ?? 0n
        return { raw, scaled: formatEther(raw) }
      },
    },
  })
