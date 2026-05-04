import { humanAddress, humanDomain } from "@repo/utils/FormattingUtils"
import { useGetTextRecords, useVechainDomain } from "@vechain/vechain-kit"

type Options = {
  domainPrefix?: number
  domainSuffix?: number
  addressPrefix?: number
  addressSuffix?: number
}

const defaults: Required<Options> = {
  domainPrefix: 15,
  domainSuffix: 10,
  addressPrefix: 8,
  addressSuffix: 6,
}

/**
 * Resolves a navigator's display name with priority:
 * 1. VET domain metadata "display" text record
 * 2. VET domain (human-truncated)
 * 3. Truncated address
 */
export const useNavigatorDisplayName = (
  address: string | undefined,
  options?: Options,
): {
  displayName: string | undefined
  domainData:
    | { address?: string; domain?: string; isValidAddressOrDomain: boolean; isPrimaryDomain: boolean }
    | undefined
  domainLoading: boolean
  textRecords: ReturnType<typeof useGetTextRecords>["data"]
} => {
  const opts = { ...defaults, ...options }
  const { data: domainData, isLoading: domainLoading } = useVechainDomain(address)
  const { data: textRecords } = useGetTextRecords(domainData?.domain)

  const displayName =
    textRecords?.display ||
    (domainData?.domain ? humanDomain(domainData.domain, opts.domainPrefix, opts.domainSuffix) : undefined) ||
    (address ? humanAddress(address, opts.addressPrefix, opts.addressSuffix) : "")

  return { displayName, domainData, domainLoading, textRecords }
}
