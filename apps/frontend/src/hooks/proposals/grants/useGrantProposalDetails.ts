import { useQuery, UseQueryResult } from "@tanstack/react-query"
import { getIpfsMetadata } from "@/api/ipfs"
import { GrantProposalEnriched, ProposalCreatedEvent, ProposalEnriched } from "./types"
import { formatEther } from "ethers"
import BigNumber from "bignumber.js"
import { Treasury__factory } from "@repo/contracts"

const treasuryInterface = Treasury__factory.createInterface()

const getAndDecodeGrantAmount = (calldata?: `0x${string}`) => {
  if (!calldata) return BigNumber(0)
  const decodedData = treasuryInterface.decodeFunctionData("transferB3TR", calldata)
  const formattedAmount = formatEther(decodedData?.[1]?.toString() ?? "0")
  return BigNumber(formattedAmount)
}
/**
 * Returns the query key for fetching multiple grant proposal details.
 * @param standardProposals Array of standard proposal event data
 * @param grantProposals Array of grant proposal event data
 * @returns The query key for fetching proposal details
 */
export const getGrantProposalDetailsQueryKey = (
  standardProposals: ProposalCreatedEvent[],
  grantProposals: ProposalCreatedEvent[],
) => [
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

const getGrantProposalMetadataOrReturnDefault = (ipfsMetadata?: GrantProposalEnriched | undefined) => {
  return {
    //Metadata fields
    title: ipfsMetadata?.projectName ?? ipfsMetadata?.shortDescription ?? "Grant Proposal",
    description: ipfsMetadata?.projectName || ipfsMetadata?.shortDescription || "",
    shortDescription: ipfsMetadata?.shortDescription || "",
    markdownDescription: ipfsMetadata?.markdownDescription || "",

    //Grant-specific fields filled from GrantFormData
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

const getStandardProposalMetadataOrReturnDefault = (ipfsMetadata?: ProposalEnriched | undefined) => {
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
export const useGrantProposalDetails = ({
  standardProposals,
  grantProposals,
}: {
  standardProposals: ProposalCreatedEvent[]
  grantProposals: ProposalCreatedEvent[]
}): UseQueryResult<{
  standardProposalsDetailsMap: Record<string, Omit<ProposalEnriched, "state">>
  grantProposalsDetailsMap: Record<string, Omit<GrantProposalEnriched, "state">>
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
          ? getIpfsMetadata<GrantProposalEnriched>(`ipfs://${event.ipfsDescription}`, false)
          : Promise.resolve(undefined),
      )
      const grantProposalsIpfsMetadatas = await Promise.all(grantProposalsIpfsMetadataPromises)

      // Batch fetch IPFS metadata for standard proposals
      const standardProposalsIpfsMetadataPromises = standardProposals.map(event =>
        event.ipfsDescription
          ? getIpfsMetadata<ProposalEnriched>(`ipfs://${event.ipfsDescription}`, false)
          : Promise.resolve(undefined),
      )
      const standardProposalsIpfsMetadatas = await Promise.all(standardProposalsIpfsMetadataPromises)

      // Create detailed proposal objects mapped by ID
      const grantProposalsDetailsMap: Record<string, Omit<GrantProposalEnriched, "state">> = {}
      const standardProposalsDetailsMap: Record<string, Omit<ProposalEnriched, "state">> = {}

      grantProposals.forEach((event, index) => {
        const ipfsMetadata = grantProposalsIpfsMetadatas[index]
        const allCalldatas = event.calldatas.map(calldata => getAndDecodeGrantAmount(calldata))
        const grantAmount = allCalldatas.reduce((acc, curr) => acc.plus(curr), BigNumber(0))
        grantProposalsDetailsMap[event.id] = {
          ...event,
          ...getGrantProposalMetadataOrReturnDefault(ipfsMetadata),
          grantAmount: grantAmount.toNumber(),
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
