import { getConfig } from "@repo/config"
import { NavigatorRegistry__factory } from "@vechain/vebetterdao-contracts"
import { useCallClause } from "@vechain/vechain-kit"
import { formatEther } from "ethers"

const address = getConfig().navigatorRegistryContractAddress as `0x${string}`
const abi = NavigatorRegistry__factory.abi
const method = "getStakedAmountAtTimepoint" as const

export const useGetStakedAmountAtTimepoint = (navigator: string, timepoint?: string) =>
  useCallClause({
    abi,
    address,
    method,
    args: [navigator as `0x${string}`, BigInt(timepoint || 0)],
    queryOptions: {
      enabled: !!navigator && !!timepoint && !!address,
      select: data => {
        const raw = (data?.[0] as bigint) ?? 0n
        return { raw, scaled: formatEther(raw) }
      },
    },
  })
