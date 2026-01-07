import { getConfig } from "@repo/config"
import { useCallClause, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"

/**
 * ABI: https://docs.vet.domains/Developers/Contracts/Verification/#abi
 * Contract: https://docs.vet.domains/Developers/Contracts/Verification/#verified-contract
 */
const abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
    ],
    name: "isVerified",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const

const address = getConfig().externalContractIntegrations?.vetDomainsContractAddress as `0x${string}`
const method = "isVerified" as const

export const getVerifiedVetDomainQueryKey = (walletAddress?: string) =>
  getCallClauseQueryKeyWithArgs({
    abi,
    address,
    method,
    args: [walletAddress as `0x${string}`],
  })

/**
 * Custom hook to fetch the verified vet domain for a given wallet address.
 *
 * @param {string} [walletAddress] - The wallet address to fetch the verified vet domain for.
 * @returns The result of the useQuery hook, with the verified vet domain.
 */

export const useVerifiedVetDomain = (walletAddress?: string) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [(walletAddress ?? "0x") as `0x${string}`],
    queryOptions: {
      enabled: !!address && !!walletAddress,
      select: data => data[0],
    },
  })
}
