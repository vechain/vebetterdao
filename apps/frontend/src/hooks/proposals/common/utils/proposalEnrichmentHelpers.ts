import BigNumber from "bignumber.js"
import type { GrantProposalEnriched, ProposalCreatedEvent, ProposalEnriched } from "../../grants/types"
import { GRANT_PROPOSAL_FALLBACKS, STANDARD_PROPOSAL_FALLBACKS } from "./proposalConstants"
import { getAndDecodeGrantAmount } from "./proposalDataHelpers"

/**
 * Creates enriched grant proposal data with fallbacks for missing fields
 * @param event - The proposal created event data
 * @param ipfsMetadata - Optional IPFS metadata for the proposal
 * @returns Enriched grant proposal with all required fields populated
 */
export const getGrantProposalDetailsWithFallbacks = (
  event: ProposalCreatedEvent,
  ipfsMetadata?: GrantProposalEnriched,
) => {
  const allCalldatas = event.calldatas.map(calldata => getAndDecodeGrantAmount(calldata))
  const grantAmountRequested = allCalldatas.reduce((acc, curr) => acc.plus(curr), BigNumber(0))

  return {
    ...GRANT_PROPOSAL_FALLBACKS,
    ...event,
    ...ipfsMetadata,
    grantAmountRequested: grantAmountRequested.toNumber(),
    // Override with smart fallbacks for key fields
    title:
      ipfsMetadata?.projectName ||
      ipfsMetadata?.shortDescription ||
      ipfsMetadata?.title ||
      `Grant Proposal #${event.id}`,
    description:
      ipfsMetadata?.projectName ||
      ipfsMetadata?.shortDescription ||
      ipfsMetadata?.description ||
      GRANT_PROPOSAL_FALLBACKS.description,
    shortDescription: ipfsMetadata?.shortDescription || GRANT_PROPOSAL_FALLBACKS.shortDescription,
    proposerAddress: event.proposerAddress, // Always available from event
  }
}

/**
 * Creates enriched standard proposal data with fallbacks for missing fields
 * @param event - The proposal created event data
 * @param ipfsMetadata - Optional IPFS metadata for the proposal
 * @returns Enriched standard proposal with all required fields populated
 */
export const getStandardProposalDetailsWithFallbacks = (
  event: ProposalCreatedEvent,
  ipfsMetadata?: ProposalEnriched,
) => {
  return {
    ...STANDARD_PROPOSAL_FALLBACKS,
    ...event,
    ...ipfsMetadata,
    // Override with smart fallbacks for key fields
    title: ipfsMetadata?.title || ipfsMetadata?.shortDescription || `Standard Proposal #${event.id}`,
    description: ipfsMetadata?.shortDescription || ipfsMetadata?.description || STANDARD_PROPOSAL_FALLBACKS.description,
    shortDescription: ipfsMetadata?.shortDescription || STANDARD_PROPOSAL_FALLBACKS.shortDescription,
    proposerAddress: event.proposerAddress, // Always available from event
  }
}
