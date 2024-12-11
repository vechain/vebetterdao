import { getConfig } from "@repo/config"

const VNS_RESOLVER = {
  main: "0xA11413086e163e41901bb81fdc5617c975Fa5a1A",
  test: "0xc403b8EA53F707d7d4de095f0A20bC491Cf2bc94",
}
//TODO: Move this to a separate file
const getNamesABI = {
  inputs: [
    {
      internalType: "address[]",
      name: "addresses",
      type: "address[]",
    },
  ],
  name: "getNames",
  outputs: [
    {
      internalType: "string[]",
      name: "names",
      type: "string[]",
    },
  ],
  stateMutability: "view",
  type: "function",
}

//TODO: Move this to a separate file
const getAddressesABI = {
  inputs: [
    {
      internalType: "string[]",
      name: "names",
      type: "string[]",
    },
  ],
  name: "getAddresses",
  outputs: [
    {
      internalType: "address[]",
      name: "addresses",
      type: "address[]",
    },
  ],
  stateMutability: "view",
  type: "function",
}

/**
 * Get the domain of an account
 */
export const getDomainFromAddress = async ({
  address,
  thor,
}: {
  address: string | null
  thor: Connex.Thor
}): Promise<string | null> => {
  if (!address) return null

  const environment = getConfig().environment

  const resolver = environment !== "mainnet" ? VNS_RESOLVER.test : VNS_RESOLVER.main

  const res = await thor.account(resolver).method(getNamesABI).call([address])

  const {
    decoded: { names },
  } = res

  return (names?.[0] as string) || null
}

/**
 * Get the address of the domain
 */
export const getAddressFromDomain = async ({
  domain,
  thor,
}: {
  domain: string | null
  thor: Connex.Thor
}): Promise<string | undefined> => {
  if (!domain) return undefined

  const environment = getConfig().environment

  const resolver = environment !== "mainnet" ? VNS_RESOLVER.test : VNS_RESOLVER.main

  const res = await thor.account(resolver).method(getAddressesABI).call([domain])

  const {
    decoded: { addresses },
  } = res

  return (addresses?.[0] as string) || undefined
}
/**
 * Check if a domain is valid by checking if it resolves to a non-zero address
 * @param domain
 * @param thor
 * @returns boolean
 */
export const isValidDomain = async (domain: string, thor: Connex.Thor) => {
  let address
  try {
    address = await getAddressFromDomain({ domain, thor })
  } catch (error) {
    return false
  }

  return !!address && address !== "0x0000000000000000000000000000000000000000"
}
