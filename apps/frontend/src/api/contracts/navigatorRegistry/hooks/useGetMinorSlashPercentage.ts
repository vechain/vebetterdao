import { getConfig } from "@repo/config"
import { NavigatorRegistry__factory } from "@vechain/vebetterdao-contracts"
import { useCallClause } from "@vechain/vechain-kit"

const address = getConfig().navigatorRegistryContractAddress as `0x${string}`
const abi = NavigatorRegistry__factory.abi
const method = "getMinorSlashPercentage" as const

export const useGetMinorSlashPercentage = () =>
  useCallClause({
    abi,
    address,
    method,
    args: [],
    queryOptions: {
      enabled: !!address,
      select: data => Number(data?.[0] ?? 0),
    },
  })
