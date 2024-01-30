import { getEvents } from "@/api/blockchain"
import { getConfig } from "@repo/config"
import GovernorContract from "@repo/contracts/artifacts/contracts/governance/GovernorContract.sol/GovernorContract.json"
import dayjs from "dayjs"
import { abi } from "thor-devkit"
const governorContractAbi = GovernorContract.abi

const GOVERNANCE_CONTRACT = getConfig().governorContractAddress

export const getProposalsEvents = async (thor: Connex.Thor) => {
  const proposalCreatedAbi = governorContractAbi.find(abi => abi.name === "ProposalCreated")
  if (!proposalCreatedAbi) throw new Error("ProposalCreated event not found")
  const proposalCreatedEvent = new abi.Event(proposalCreatedAbi as abi.Event.Definition)

  const proposalCanceledAbi = governorContractAbi.find(abi => abi.name === "ProposalCanceled")
  if (!proposalCanceledAbi) throw new Error("ProposalCanceled event not found")
  const proposalCanceledEvent = new abi.Event(proposalCanceledAbi as abi.Event.Definition)

  const filterCriteria = [
    {
      address: GOVERNANCE_CONTRACT,
      topic0: proposalCreatedEvent.signature,
    },
    {
      address: GOVERNANCE_CONTRACT,
      topic0: proposalCanceledEvent.signature,
    },
  ]

  //TODO: decode the events
  const events = await getEvents({ thor, filterCriteria })
  return events
}

/**
 * Get the current proposal threshold from the governor contract (i.e the number of votes required to create a proposal)
 * @param thor  the thor client
 * @returns  the current proposal threshold
 */
export const getProposalThreshold = async (thor: Connex.Thor) => {
  const proposalThresholdAbi = governorContractAbi.find(abi => abi.name === "proposalThreshold")
  if (!proposalThresholdAbi) throw new Error("proposalThreshold function not found")
  const res = await thor.account(GOVERNANCE_CONTRACT).method(proposalThresholdAbi).call()

  if (res.vmError) return Promise.reject(new Error(res.vmError))
  return res.decoded[0]
}

// /**
//  * Get the votes of the given address at the given timepoint
//  * @param thor  the thor client
//  * @returns the votes of the given address at the given timepoint
//  */
// export const getVotes = async (thor: Connex.Thor, address?: string) => {
//   if (!address) throw new Error("address is required")

//   const timepoint = thor.status.head.number

//   console.log({ timepoint })

//   const getVotesAbi = governorContractAbi.find(abi => abi.name === "getVotes")
//   if (!getVotesAbi) throw new Error("getVotes function not found")
//   const res = await thor.account(GOVERNANCE_CONTRACT).method(getVotesAbi).call(address, timepoint)

//   console.log({ res })
//   if (res.vmError) return Promise.reject(new Error(res.vmError))

//   return res.decoded[0]
// }

/**
 * Build the clause to create a proposal with the given parameters
 * @param thor the thor client
 * @param contractsAbi the contracts to execute the proposal on
 * @param targets the contract addresses targets of the proposal calls
 * @param values the values to pass as parameters to the proposal calls
 * @param functionsAbiNames the names of the functions to call on the contracts
 * @param description the description of the proposal
 * @returns the clause to create the proposal
 */
export const buildCreateProposalTx = (
  thor: Connex.Thor,
  contractsAbi: (typeof governorContractAbi)[number][],
  targets: string[],
  values: (string | number)[][],
  description: string,
): Connex.Vendor.TxMessage[0] => {
  // all the arrays must have the same length as there is a 1 to 1 mapping between the elements
  const arrays = [contractsAbi, targets, values]
  const lengths = arrays.map(array => array.length)
  const firstLength = lengths[0]
  if (lengths.some(length => length !== firstLength))
    throw new Error("contractsAbi, targets, values must have the same length")

  const callData: string[] = []
  // build the callData for each contractAbi
  for (const [index, contractAbi] of contractsAbi.entries()) {
    const functionCallValues = values[index] as (string | number)[]
    const functionAbiInstance = new abi.Function(contractAbi as abi.Function.Definition)
    const encodedCallData = functionAbiInstance.encode(...functionCallValues)
    callData.push(encodedCallData)
  }

  // build the clause to create the proposal with the given parameters
  const proposalAbi = governorContractAbi.find(abi => abi.name === "propose")
  if (!proposalAbi) throw new Error("Proposal abi not found")

  const clause = thor.account(GOVERNANCE_CONTRACT).method(proposalAbi).asClause(targets, [0], callData, description)

  return {
    ...clause,
    comment: `Create proposal to ${targets} with values ${values} and callData ${callData}`,
    abi: proposalAbi,
  }
}
