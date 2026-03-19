import { getConfig } from "@repo/config"
import { useCallClause } from "@vechain/vechain-kit"

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"

const abi = [
  {
    inputs: [
      { name: "tokenAddress", type: "address" },
      { name: "senderAddress", type: "address" },
    ],
    name: "tokenSenderConfiguration",
    outputs: [
      { name: "recipient", type: "address" },
      { name: "ratio", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const

export const useVeDelegateAutoDeposit = (userAddress?: string) => {
  const { b3trContractAddress, veDelegateAutoDepositContractAddress } = getConfig()

  const result = useCallClause({
    abi,
    address: veDelegateAutoDepositContractAddress as `0x${string}`,
    method: "tokenSenderConfiguration",
    args: [b3trContractAddress as `0x${string}`, userAddress as `0x${string}`],
    queryOptions: {
      enabled: !!userAddress,
    },
  })

  const recipient = result.data?.[0]?.[0] as string | undefined

  return {
    ...result,
    hasAutoDeposit: !!recipient && recipient !== ZERO_ADDRESS,
  }
}
