import { useQuery } from "@tanstack/react-query"
import { getIpfsMetadata } from "@/api/ipfs"

export interface GrantProposalEventData {
  id: string
  ipfsDescription: string
  proposerAddress: string
  createdAt: number
  grantAmount: any // BigNumber type
  votingRoundId: string
  depositThreshold: string
  calldatas: readonly string[]
  targets: readonly string[]
}

export interface GrantProposalDetails {
  id: string
  title: string
  description: string
  image?: string
  proposerDomain?: string
  ipfsMetadata?: {
    title?: string
    description?: string
    shortDescription?: string
    image?: string
    [key: string]: any
  }
}

/**
 * Returns the query key for fetching multiple grant proposal details.
 * @param proposalEvents Array of proposal event data
 * @returns The query key for fetching proposal details
 */
export const getGrantProposalDetailsQueryKey = (proposalEvents: GrantProposalEventData[]) => [
  "grantProposalDetails",
  proposalEvents
    .map(e => e.id)
    .sort()
    .join(","),
]

/**
 * Hook to fetch detailed information for grant proposals including IPFS metadata
 * @param proposalEvents Array of proposal event data containing IPFS hashes and proposer addresses
 * @returns Object with detailed proposal information mapped by proposal ID
 */
export const useGrantProposalDetails = (proposalEvents: GrantProposalEventData[]) => {
  return useQuery({
    queryKey: getGrantProposalDetailsQueryKey(proposalEvents),
    queryFn: async () => {
      if (proposalEvents.length === 0) {
        return {}
      }

      // Batch fetch IPFS metadata for all proposals
      const ipfsMetadataPromises = proposalEvents.map(event =>
        event.ipfsDescription
          ? getIpfsMetadata<{
              title?: string
              description?: string
              shortDescription?: string
              image?: string
            }>(event.ipfsDescription, false)
          : Promise.resolve(undefined),
      )

      // TODO: Batch resolve VNS domain
      // This would require additional implementation based on your domain resolution strategy
      const proposerDomainsPromises = proposalEvents.map(
        _ => Promise.resolve(undefined), // Placeholder for domain resolution
      )

      const [ipfsMetadatas, proposerDomains] = await Promise.all([
        Promise.all(ipfsMetadataPromises),
        Promise.all(proposerDomainsPromises),
      ])

      // Create detailed proposal objects mapped by ID
      const detailsMap: Record<string, GrantProposalDetails> = {}

      proposalEvents.forEach((event, index) => {
        const ipfsMetadata = ipfsMetadatas[index]
        const proposerDomain = proposerDomains[index]

        detailsMap[event.id] = {
          id: event.id,
          title: ipfsMetadata?.title || ipfsMetadata?.shortDescription || "Grant Proposal",
          description: ipfsMetadata?.description || ipfsMetadata?.shortDescription || "",
          image: ipfsMetadata?.image
            ? `https://api.gateway-proxy.vechain.org/ipfs/${ipfsMetadata.image.replace("ipfs://", "")}`
            : undefined,
          proposerDomain,
          ipfsMetadata,
        }
      })

      return detailsMap
    },
    enabled: proposalEvents.length > 0,
  })
}
