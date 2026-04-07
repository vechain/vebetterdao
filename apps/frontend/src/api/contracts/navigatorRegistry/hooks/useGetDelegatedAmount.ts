import { getConfig } from "@repo/config"
import { NavigatorRegistry__factory } from "@vechain/vebetterdao-contracts"
import { getCallClauseQueryKeyWithArgs, useCallClause, useWallet } from "@vechain/vechain-kit"
import { formatEther } from "ethers"

const address = getConfig().navigatorRegistryContractAddress as `0x${string}`
const abi = NavigatorRegistry__factory.abi
const method = "getDelegatedAmount" as const

export const getGetDelegatedAmountQueryKey = (citizen: string) =>
  getCallClauseQueryKeyWithArgs({ abi, address, method, args: [citizen as `0x${string}`] })

export const useGetDelegatedAmount = (citizen?: string) => {
  const { account } = useWallet()
  const addr = citizen || account?.address || ""

  return useCallClause({
    abi,
    address,
    method,
    args: [addr as `0x${string}`],
    queryOptions: {
      enabled: !!addr && !!address,
      select: data => {
        const raw = (data?.[0] as bigint) ?? 0n
        return { raw, scaled: formatEther(raw) }
      },
    },
  })
}
