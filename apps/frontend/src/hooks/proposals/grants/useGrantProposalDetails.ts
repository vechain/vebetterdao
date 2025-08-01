import { useQuery, UseQueryResult } from "@tanstack/react-query"
import { getIpfsMetadata } from "@/api/ipfs"
import { Proposal } from "./types"
import { ProposalState } from "@/api"
import { GrantProposalMetadata } from "@/hooks/useUploadGrantProposalMetadata"

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
export const useGrantProposalDetails = (
  proposalEvents: Proposal[],
): UseQueryResult<Record<string, GrantProposalMetadata & Proposal>> => {
  return useQuery({
    queryKey: getGrantProposalDetailsQueryKey(proposalEvents),
    queryFn: async () => {
      if (proposalEvents.length === 0) {
        return {}
      }

      // Batch fetch IPFS metadata for all proposals
      const ipfsMetadataPromises = proposalEvents.map(event =>
        event.ipfsDescription
          ? getIpfsMetadata<GrantProposalMetadata>(`ipfs://${event.ipfsDescription}`, false)
          : Promise.resolve(undefined),
      )

      const ipfsMetadatas = await Promise.all(ipfsMetadataPromises)

      // Create detailed proposal objects mapped by ID
      const detailsMap: Record<string, GrantProposalMetadata & Proposal> = {}

      proposalEvents.forEach((event, index) => {
        const ipfsMetadata = ipfsMetadatas[index]

        detailsMap[event.id] = {
          ...event,
          title: ipfsMetadata?.projectName || ipfsMetadata?.shortDescription || "Grant Proposal",
          description: ipfsMetadata?.projectName || ipfsMetadata?.shortDescription || "",
          shortDescription: ipfsMetadata?.shortDescription || "",
          state: event.state ?? ProposalState.Pending,
          projectName: ipfsMetadata?.projectName ?? "",
          companyName: ipfsMetadata?.companyName ?? "",
          appTestnetUrl: ipfsMetadata?.appTestnetUrl ?? "",
          projectWebsite: ipfsMetadata?.projectWebsite ?? "",
          githubUsername: ipfsMetadata?.githubUsername ?? "",
          twitterUsername: ipfsMetadata?.twitterUsername ?? "",
          discordUsername: ipfsMetadata?.discordUsername ?? "",
          grantType: ipfsMetadata?.grantType ?? "",
          problemDescription: ipfsMetadata?.problemDescription ?? "",
          solutionDescription: ipfsMetadata?.solutionDescription ?? "",
          targetUsers: ipfsMetadata?.targetUsers ?? "",
          competitiveEdge: ipfsMetadata?.competitiveEdge ?? "",
          benefitsToUsers: ipfsMetadata?.benefitsToUsers ?? "",
          benefitsToDApps: ipfsMetadata?.benefitsToDApps ?? "",
          x2EModel: ipfsMetadata?.x2EModel ?? "",
          revenueModel: ipfsMetadata?.revenueModel ?? "",
          highLevelRoadmap: ipfsMetadata?.highLevelRoadmap ?? "",
          milestones: ipfsMetadata?.milestones ?? [],
          benefitsToVeChainEcosystem: ipfsMetadata?.benefitsToVeChainEcosystem ?? "",
          applicantName: ipfsMetadata?.applicantName ?? "",
          applicantSurname: ipfsMetadata?.applicantSurname ?? "",
          applicantRole: ipfsMetadata?.applicantRole ?? "",
          applicantProfileUrl: ipfsMetadata?.applicantProfileUrl ?? "",
          applicantCountry: ipfsMetadata?.applicantCountry ?? "",
          applicantCity: ipfsMetadata?.applicantCity ?? "",
        }
      })

      return detailsMap
    },
    enabled: proposalEvents.length > 0,
  })
}
