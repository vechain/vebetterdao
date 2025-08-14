import { useQuery, UseQueryResult } from "@tanstack/react-query"
import { getIpfsMetadata } from "@/api/ipfs"
import { GrantProposalMetadata, Proposal, StandardProposalMetadata } from "./types"

/**
 * Returns the query key for fetching multiple grant proposal details.
 * @param standardProposals Array of standard proposal event data
 * @param grantProposals Array of grant proposal event data
 * @returns The query key for fetching proposal details
 */
export const getGrantProposalDetailsQueryKey = (standardProposals: Proposal[], grantProposals: Proposal[]) => [
  "grantProposalDetails",
  standardProposals
    .map(e => e.id)
    .sort()
    .join(","),
  grantProposals
    .map(e => e.id)
    .sort()
    .join(","),
]

const getGrantProposalMetadataOrReturnDefault = (ipfsMetadata?: GrantProposalMetadata | undefined) => {
  return {
    title: ipfsMetadata?.projectName || ipfsMetadata?.shortDescription || "Grant Proposal",
    description: ipfsMetadata?.projectName || ipfsMetadata?.shortDescription || "",
    shortDescription: ipfsMetadata?.shortDescription || "",
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
}

const getStandardProposalMetadataOrReturnDefault = (ipfsMetadata?: StandardProposalMetadata | undefined) => {
  return {
    title: ipfsMetadata?.title ?? "",
    shortDescription: ipfsMetadata?.shortDescription ?? "",
    ipfsDescription: ipfsMetadata?.ipfsDescription ?? "",
    markdownDescription: ipfsMetadata?.markdownDescription ?? "",
    description: ipfsMetadata?.shortDescription ?? "",
  }
}

/**
 * Hook to fetch detailed information for grant proposals including IPFS metadata
 * @param standardProposals Array of standard proposal event data containing IPFS hashes and proposer addresses
 * @param grantProposals Array of grant proposal event data containing IPFS hashes and proposer addresses
 * @returns Object with detailed proposal information mapped by proposal ID
 */
export const useGrantProposalDetails = (
  standardProposals: Proposal[],
  grantProposals: Proposal[],
): UseQueryResult<{
  standardProposalsDetailsMap: Record<string, StandardProposalMetadata>
  grantProposalsDetailsMap: Record<string, GrantProposalMetadata & Proposal>
}> => {
  return useQuery({
    queryKey: getGrantProposalDetailsQueryKey(standardProposals, grantProposals),
    queryFn: async () => {
      if (standardProposals.length === 0 && grantProposals.length === 0) {
        return {
          grantProposalsDetailsMap: {},
          standardProposalsDetailsMap: {},
        }
      }

      // Batch fetch IPFS metadata for grant proposals
      const grantProposalsIpfsMetadataPromises = grantProposals.map(event =>
        event.ipfsDescription
          ? getIpfsMetadata<GrantProposalMetadata>(`ipfs://${event.ipfsDescription}`, false)
          : Promise.resolve(undefined),
      )
      const grantProposalsIpfsMetadatas = await Promise.all(grantProposalsIpfsMetadataPromises)

      // Batch fetch IPFS metadata for standard proposals
      const standardProposalsIpfsMetadataPromises = standardProposals.map(event =>
        event.ipfsDescription
          ? getIpfsMetadata<StandardProposalMetadata>(`ipfs://${event.ipfsDescription}`, false)
          : Promise.resolve(undefined),
      )
      const standardProposalsIpfsMetadatas = await Promise.all(standardProposalsIpfsMetadataPromises)

      // Create detailed proposal objects mapped by ID
      const grantProposalsDetailsMap: Record<string, GrantProposalMetadata & Proposal> = {}
      const standardProposalsDetailsMap: Record<string, StandardProposalMetadata> = {}

      grantProposals.forEach((event, index) => {
        const ipfsMetadata = grantProposalsIpfsMetadatas[index]

        grantProposalsDetailsMap[event.id] = {
          ...event,
          ...getGrantProposalMetadataOrReturnDefault(ipfsMetadata),
        }
      })

      standardProposals.forEach((event, index) => {
        const ipfsMetadata = standardProposalsIpfsMetadatas[index]
        standardProposalsDetailsMap[event.id] = {
          ...event,
          ...getStandardProposalMetadataOrReturnDefault(ipfsMetadata),
        }
      })

      return { grantProposalsDetailsMap, standardProposalsDetailsMap }
    },
    enabled: standardProposals.length > 0 || grantProposals.length > 0,
  })
}
