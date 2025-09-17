import { getIpfsMetadata } from "@/api/ipfs"
import { useQueries } from "@tanstack/react-query"
import { Treasury__factory } from "@vechain/vebetterdao-contracts"
import BigNumber from "bignumber.js"
import { formatEther } from "ethers"
import { useMemo } from "react"

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

/**
 * Returns the query key for fetching individual grant proposal metadata.
 * @param proposalId The proposal ID
 * @param ipfsHash The IPFS hash
 */
export const getGrantProposalMetadataQueryKey = (proposalId: string, ipfsHash?: string) => [
  "grantProposalMetadata",
  proposalId,
  ipfsHash,
]

/**
 * Returns the query key for fetching individual standard proposal metadata.
 * @param proposalId The proposal ID
 * @param ipfsHash The IPFS hash
 */
export const getStandardProposalMetadataQueryKey = (proposalId: string, ipfsHash?: string) => [
  "standardProposalMetadata",
  proposalId,
  ipfsHash,
]

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
  if (!ipfsUri) return undefined

  try {
    const result = await getIpfsMetadata<T>(ipfsUri, parseJson)
    // Validate that we got actual data, not just an empty object
    if (result && typeof result === "object" && Object.keys(result).length > 0) {
      return result
    }
    // If we got an empty object or null, treat it as a failure to trigger retry
    throw new Error(`Empty or invalid metadata received for ${ipfsUri}`)
  } catch (error) {
    console.error("Error fetching proposal IPFS metadata for", ipfsUri, ":", error)
    // Re-throw to trigger retry mechanism
    throw error
  }
}

/**
 * Hook to fetch detailed information for grant proposals including IPFS metadata
 * Uses individual queries for each proposal to prevent failures from blocking successful fetches
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
}) => {
  // Create unique queries for each grant proposal
  const grantProposalQueries = useQueries({
    queries: grantProposals.map(proposal => ({
      queryKey: getGrantProposalMetadataQueryKey(proposal.id, proposal.ipfsDescription),
      queryFn: async () => {
        if (!proposal.ipfsDescription) return undefined
        return await safeFetchIpfsMetadata<GrantProposalEnriched>(`ipfs://${proposal.ipfsDescription}`, false)
      },
    })),
  })

  // Create unique queries for each standard proposal
  const standardProposalQueries = useQueries({
    queries: standardProposals.map(proposal => ({
      queryKey: getStandardProposalMetadataQueryKey(proposal.id, proposal.ipfsDescription),
      queryFn: async () => {
        if (!proposal.ipfsDescription) return undefined
        return await safeFetchIpfsMetadata<ProposalEnriched>(`ipfs://${proposal.ipfsDescription}`, false)
      },
    })),
  })

  // Memoize the processed results to avoid unnecessary re-calculations
  const result = useMemo(() => {
    // Create detailed proposal objects mapped by ID
    const grantProposalsDetailsMap: Record<
      string,
      Omit<GrantProposalEnriched, "state" | "votingRoundId" | "isStateLoading" | "isLoading">
    > = {}
    const standardProposalsDetailsMap: Record<
      string,
      Omit<ProposalEnriched, "state" | "votingRoundId" | "isStateLoading" | "isLoading">
    > = {}

    // Process grant proposals
    grantProposals.forEach((event, index) => {
      const query = grantProposalQueries[index]
      const ipfsMetadata = query?.data
      const allCalldatas = event.calldatas.map(calldata => getAndDecodeGrantAmount(calldata))
      const grantAmountRequested = allCalldatas.reduce((acc, curr) => acc.plus(curr), BigNumber(0))

      grantProposalsDetailsMap[event.id] = {
        ...event,
        ...getGrantProposalMetadataOrReturnDefault(ipfsMetadata),
        grantAmountRequested: grantAmountRequested.toNumber(),
      }
    })

    // Process standard proposals
    standardProposals.forEach((event, index) => {
      const query = standardProposalQueries[index]
      const ipfsMetadata = query?.data

      standardProposalsDetailsMap[event.id] = {
        ...event,
        ...getStandardProposalMetadataOrReturnDefault(ipfsMetadata),
      }
    })

    // Calculate loading and error states
    const isLoading = grantProposalQueries.some(q => q.isLoading) || standardProposalQueries.some(q => q.isLoading)
    const isError = grantProposalQueries.some(q => q.isError) || standardProposalQueries.some(q => q.isError)
    const error = grantProposalQueries.find(q => q.error)?.error || standardProposalQueries.find(q => q.error)?.error

    return {
      data: { grantProposalsDetailsMap, standardProposalsDetailsMap },
      isLoading,
      isError,
      error,
      isSuccess: !isLoading && !isError,
    }
  }, [grantProposals, standardProposals, grantProposalQueries, standardProposalQueries])

  return result
}
