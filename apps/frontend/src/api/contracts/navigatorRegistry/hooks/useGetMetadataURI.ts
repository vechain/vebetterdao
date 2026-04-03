import { getConfig } from "@repo/config"
import { NavigatorRegistry__factory } from "@vechain/vebetterdao-contracts"
import { useCallClause } from "@vechain/vechain-kit"

const address = getConfig().navigatorRegistryContractAddress as `0x${string}`
const abi = NavigatorRegistry__factory.abi
const method = "getMetadataURI" as const

export const useGetMetadataURI = (navigator: string) =>
  useCallClause({
    abi,
    address,
    method,
    args: [navigator as `0x${string}`],
    queryOptions: {
      enabled: !!navigator && !!address,
      select: data => data[0] as string,
    },
  })
