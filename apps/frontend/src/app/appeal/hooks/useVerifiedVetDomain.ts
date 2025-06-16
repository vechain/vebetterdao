import { getConfig } from "@repo/config"
import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/vechain-kit"

/**
 * ABI: https://docs.vet.domains/Developers/Contracts/Verification/#abi
 * Contract: https://docs.vet.domains/Developers/Contracts/Verification/#verified-contract
 */
const abiFragment = JSON.stringify({
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
})
const VET_DOMAINS_CONTRACT_ADDRESS = getConfig().externalContractIntegrations?.vetDomainsContractAddress

/**
 * Function to check if a wallet address is verified.
 *
 * @param {Connex.Thor} thor - The thor instance
 * @param {string} walletAddress - The wallet address to check if it is verified
 * @returns {Promise<boolean>} A promise that resolves to a boolean indicating if the wallet is verified
 *
 * @dependency https://docs.vet.domains/Developers/Contracts/Verification/
 */
export const getVerifiedVetDomain = async (thor: Connex.Thor, walletAddress?: string): Promise<boolean> => {
  if (!walletAddress) return Promise.reject(new Error("walletAddress is required"))
  if (!VET_DOMAINS_CONTRACT_ADDRESS) return Promise.reject(new Error("VET_DOMAINS_CONTRACT_ADDRESS is not set"))

  const res = await thor.account(VET_DOMAINS_CONTRACT_ADDRESS).method(JSON.parse(abiFragment)).call(walletAddress)

  if (res.vmError) return Promise.reject(new Error(res.vmError))

  return res.decoded[0]
}

export const getVerifiedVetDomainQueryKey = (walletAddress?: string) => ["verifiedVetDomain", walletAddress]

/**
 * Custom hook to fetch the verified vet domain for a given wallet address.
 *
 * @param {string} [walletAddress] - The wallet address to fetch the verified vet domain for.
 * @returns The result of the useQuery hook, with the verified vet domain.
 */
export const useVerifiedVetDomain = (walletAddress?: string) => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getVerifiedVetDomainQueryKey(walletAddress),
    queryFn: () => getVerifiedVetDomain(thor, walletAddress),
  })
}
