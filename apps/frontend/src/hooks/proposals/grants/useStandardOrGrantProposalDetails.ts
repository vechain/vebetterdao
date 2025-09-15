import { getIpfsMetadata } from "@/api/ipfs"
import { useQuery, UseQueryResult } from "@tanstack/react-query"
import { Treasury__factory } from "@vechain/vebetterdao-contracts"
import BigNumber from "bignumber.js"
import { formatEther } from "ethers"

import { GrantProposalEnriched, ProposalCreatedEvent, ProposalEnriched } from "./types"

const treasuryInterface = Treasury__factory.createInterface()

const getAndDecodeGrantAmount = (calldata?: `0x${string}`) => {
  if (!calldata) return BigNumber(0)
  const decodedData = treasuryInterface.decodeFunctionData("transferB3TR", calldata)
  const formattedAmount = formatEther(decodedData?.[1]?.toString() ?? "0")
  return BigNumber(formattedAmount)
}
/**
 * Returns the query key for fetching proposal metadata details.
 * @returns The query key for fetching proposal metadata details
 */
export const getAllProposalsMetadataQueryKey = () => ["proposalMetadataDetails", "ALL"]

export const getGrantProposalMetadataOrReturnDefault = (ipfsMetadata?: GrantProposalEnriched | undefined) => {
  return {
    //Metadata fields
    title: ipfsMetadata?.projectName ?? ipfsMetadata?.shortDescription ?? "Grant Proposal",
    description: ipfsMetadata?.projectName || ipfsMetadata?.shortDescription || "",
    shortDescription: ipfsMetadata?.shortDescription || "",
    markdownDescription: ipfsMetadata?.markdownDescription || "",
    discourseUrl: ipfsMetadata?.discourseUrl ?? "",

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
    // TODO(Grant) : Add key points
    targetUsers: ipfsMetadata?.targetUsers ?? "",
    competitiveEdge: ipfsMetadata?.competitiveEdge ?? "",
    benefitsToUsers: ipfsMetadata?.benefitsToUsers ?? "",
    benefitsToDApps: ipfsMetadata?.benefitsToDApps ?? "",
    x2EModel: ipfsMetadata?.x2EModel ?? "",
    revenueModel: ipfsMetadata?.revenueModel ?? "",
    highLevelRoadmap: ipfsMetadata?.highLevelRoadmap ?? "",
    milestones: ipfsMetadata?.milestones ?? [],
    benefitsToVeChainEcosystem: ipfsMetadata?.benefitsToVeChainEcosystem ?? "",
    companyRegisteredNumber: ipfsMetadata?.companyRegisteredNumber ?? "",
    companyIntro: ipfsMetadata?.companyIntro ?? "",
    companyEmail: ipfsMetadata?.companyEmail ?? "",
    companyTelegram: ipfsMetadata?.companyTelegram ?? "",
    grantsReceiverAddress: ipfsMetadata?.grantsReceiverAddress ?? "",
    outcomesAttachment: ipfsMetadata?.outcomesAttachment ?? [],
  }
}

const getStandardProposalMetadataOrReturnDefault = (ipfsMetadata?: ProposalEnriched | undefined) => {
  return {
    title: ipfsMetadata?.title ?? "",
    shortDescription: ipfsMetadata?.shortDescription ?? "",
    ipfsDescription: ipfsMetadata?.ipfsDescription ?? "",
    markdownDescription: ipfsMetadata?.markdownDescription ?? "",
    description: ipfsMetadata?.shortDescription ?? "",
    discourseUrl: ipfsMetadata?.discourseUrl ?? "",
  }
}

const safeFetchIpfsMetadata = async <T>(ipfsUri?: string, parseJson = false): Promise<T | undefined> => {
  try {
    const result = await getIpfsMetadata<T>(ipfsUri, parseJson)
    return result
  } catch (error) {
    console.error("Error fetching proposal IPFS metadata for", ipfsUri, ":", error)
    return undefined
  }
}

/**
 * Hook to fetch detailed information for grant proposals including IPFS metadata
 * @param standardProposals Array of standard proposal event data containing IPFS hashes and proposer addresses
 * @param grantProposals Array of grant proposal event data containing IPFS hashes and proposer addresses
 * @returns Object with detailed proposal information mapped by proposal ID
 */
export const useStandardOrGrantProposalDetails = ({
  standardProposals,
  grantProposals,
}: {
  standardProposals: ProposalCreatedEvent[]
  grantProposals: ProposalCreatedEvent[]
}): UseQueryResult<{
  standardProposalsDetailsMap: Record<
    string,
    Omit<ProposalEnriched, "state" | "votingRoundId" | "isStateLoading" | "isLoading">
  >
  grantProposalsDetailsMap: Record<
    string,
    Omit<GrantProposalEnriched, "state" | "votingRoundId" | "isStateLoading" | "isLoading">
  >
}> => {
  return useQuery({
    queryKey: getAllProposalsMetadataQueryKey(),
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
          ? safeFetchIpfsMetadata<GrantProposalEnriched>(`ipfs://${event.ipfsDescription}`, false)
          : Promise.resolve(undefined),
      )
      const grantProposalsIpfsMetadatas = await Promise.all(grantProposalsIpfsMetadataPromises)

      // Batch fetch IPFS metadata for standard proposals
      const standardProposalsIpfsMetadataPromises = standardProposals.map(event =>
        event.ipfsDescription
          ? safeFetchIpfsMetadata<ProposalEnriched>(`ipfs://${event.ipfsDescription}`, false)
          : Promise.resolve(undefined),
      )
      const standardProposalsIpfsMetadatas = await Promise.all(standardProposalsIpfsMetadataPromises)

      // Create detailed proposal objects mapped by ID
      const grantProposalsDetailsMap: Record<
        string,
        Omit<GrantProposalEnriched, "state" | "votingRoundId" | "isStateLoading" | "isLoading">
      > = {}
      const standardProposalsDetailsMap: Record<
        string,
        Omit<ProposalEnriched, "state" | "votingRoundId" | "isStateLoading" | "isLoading">
      > = {}

      grantProposals.forEach((event, index) => {
        const ipfsMetadata = grantProposalsIpfsMetadatas[index]
        const allCalldatas = event.calldatas.map(calldata => getAndDecodeGrantAmount(calldata))
        const grantAmountRequested = allCalldatas.reduce((acc, curr) => acc.plus(curr), BigNumber(0))
        grantProposalsDetailsMap[event.id] = {
          ...event,
          ...getGrantProposalMetadataOrReturnDefault(ipfsMetadata),
          grantAmountRequested: grantAmountRequested.toNumber(),
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
