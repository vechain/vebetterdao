import { humanAddress } from "@repo/utils/FormattingUtils"
interface DomainOrAddressProps {
  domain: string
  address: string
  options?: {
    prefixLength: number
    suffixLength: number
  }
}

/**
 * Custom hook to fallback address if the domain is not defined.
 *
 * @returns {string} The domain, or the address if the above is not defined.
 */

export const useDomainOrAddress = ({
  domain,
  address,
  options = { prefixLength: 6, suffixLength: 3 },
}: DomainOrAddressProps): string => {
  if (domain == "") {
    if (address == "") {
      throw new Error("No domain or address provided")
    }
    return humanAddress(address, options.prefixLength, options.suffixLength)
  }

  const formattedDomain = domain.trim()

  return formattedDomain
}
