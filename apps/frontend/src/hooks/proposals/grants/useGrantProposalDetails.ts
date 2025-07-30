import { useQuery } from "@tanstack/react-query"
import { getIpfsMetadata } from "@/api/ipfs"
import { Proposal, ProposalEnriched } from "./types"
import { ProposalState } from "@/api"

/**
 * Returns the query key for fetching multiple grant proposal details.
 * @param proposalEvents Array of proposal event data
 * @returns The query key for fetching proposal details
 */
export const getGrantProposalDetailsQueryKey = (proposalEvents: Proposal[]) => [
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
export const useGrantProposalDetails = (proposalEvents: Proposal[]) => {
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
      const detailsMap: Record<string, ProposalEnriched> = {}

      proposalEvents.forEach((event, index) => {
        const ipfsMetadata = ipfsMetadatas[index]
        const proposerDomain = proposerDomains[index]

        detailsMap[event.id] = {
          ...event,
          b3tr: "", //TODO: FIX THIS
          dAppGrant: "", //TODO: FIX THIS
          state: ProposalState.Pending,
          phases: {
            //TODO: FIX THIS
            [ProposalState.Pending]: {
              startAt: "0",
              endAt: "0",
            },
            [ProposalState.Active]: {
              startAt: "0",
              endAt: "0",
            },
          },
          title: ipfsMetadata?.title || ipfsMetadata?.shortDescription || "Grant Proposal",
          description: ipfsMetadata?.description || ipfsMetadata?.shortDescription || "",
          proposer: {
            profilePicture: "", //TODO: FIX THIS
            addressOrDomain: proposerDomain ?? event.proposerAddress,
          },
        }
      })

      return detailsMap
    },
    enabled: proposalEvents.length > 0,
  })
}
