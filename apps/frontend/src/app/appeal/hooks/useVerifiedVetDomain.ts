import { getConfig } from "@repo/config"
import { useQuery } from "@tanstack/react-query"
import { useThor } from "@vechain/vechain-kit"
import { ThorClient } from "@vechain/sdk-network"

/**
 * ABI: https://docs.vet.domains/Developers/Contracts/Verification/#abi
 * Contract: https://docs.vet.domains/Developers/Contracts/Verification/#verified-contract
 */
const vetDomainsAbi = [
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

const VET_DOMAINS_CONTRACT_ADDRESS = getConfig().externalContractIntegrations?.vetDomainsContractAddress

/**
 * Function to check if a wallet address is verified.
 *
 * @param {ThorClient} thor - The thor instance
 * @param {string} walletAddress - The wallet address to check if it is verified
 * @returns {Promise<boolean>} A promise that resolves to a boolean indicating if the wallet is verified
 *
 * @dependency https://docs.vet.domains/Developers/Contracts/Verification/
 */
export const getVerifiedVetDomain = async (thor: ThorClient, walletAddress?: string): Promise<boolean> => {
  if (!walletAddress) return Promise.reject(new Error("walletAddress is required"))
  if (!VET_DOMAINS_CONTRACT_ADDRESS) return Promise.reject(new Error("VET_DOMAINS_CONTRACT_ADDRESS is not set"))

  const res = await thor.contracts.load(VET_DOMAINS_CONTRACT_ADDRESS, vetDomainsAbi).read.isVerified(walletAddress)

  if (!res) return Promise.reject(new Error("VET domains verification call failed"))

  return res[0] as boolean
}

export const getVerifiedVetDomainQueryKey = (walletAddress?: string) => ["verifiedVetDomain", walletAddress]

/**
 * Custom hook to fetch the verified vet domain for a given wallet address.
 *
 * @param {string} [walletAddress] - The wallet address to fetch the verified vet domain for.
 * @returns The result of the useQuery hook, with the verified vet domain.
 */
export const useVerifiedVetDomain = (walletAddress?: string) => {
  const thor = useThor()

  return useQuery({
    queryKey: getVerifiedVetDomainQueryKey(walletAddress),
    queryFn: () => getVerifiedVetDomain(thor, walletAddress),
    enabled: !!thor && !!walletAddress,
  })
}
