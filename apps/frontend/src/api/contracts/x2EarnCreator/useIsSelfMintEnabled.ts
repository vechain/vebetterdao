import { getConfig } from "@repo/config"
import { useCallClause } from "@vechain/vechain-kit"

const address = getConfig().x2EarnCreatorContractAddress as `0x${string}`

const abi = [
  {
    inputs: [],
    name: "selfMintEnabled",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
] as const

export const useIsSelfMintEnabled = () => {
  return useCallClause({
    abi,
    address,
    method: "selfMintEnabled",
    args: [],
    queryOptions: {
      select: data => data[0] as boolean,
    },
  })
}
