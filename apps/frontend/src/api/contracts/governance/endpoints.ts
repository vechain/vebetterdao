import { getEvents } from "@/api/blockchain"
import { getConfig } from "@repo/config"
import Contract from "@repo/contracts/artifacts/contracts/governance/GovernorContract.sol/GovernorContract.json"
import { abi } from "thor-devkit"
const contractAbi = Contract.abi

const GOVERNANCE_CONTRACT = getConfig().governorContractAddress

export const getProposalsEvents = async (thor: Connex.Thor) => {
  const proposalCreatedAbi = contractAbi.find(abi => abi.name === "ProposalCreated")
  if (!proposalCreatedAbi) throw new Error("ProposalCreated event not found")
  const proposalCreatedEvent = new abi.Event(proposalCreatedAbi as abi.Event.Definition)

  const proposalCanceledAbi = contractAbi.find(abi => abi.name === "ProposalCanceled")
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
  contractsAbi: (typeof Contract.abi)[number][],
  targets: string[],
  values: (string | number)[][],
  description: string,
): Connex.Vendor.TxMessage[0] => {
  console.log({
    contractsAbi,
    targets,
    values,
    description,
  })
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
    console.log({ functionCallValues })
    const functionAbiInstance = new abi.Function(contractAbi as abi.Function.Definition)
    console.log({ functionAbiInstance })
    const encodedCallData = functionAbiInstance.encode(...functionCallValues)
    callData.push(encodedCallData)
  }

  // build the clause to create the proposal with the given parameters
  const proposalAbi = contractAbi.find(abi => abi.name === "propose")
  if (!proposalAbi) throw new Error("Proposal abi not found")
  const proposalAbiInstance = new abi.Function(proposalAbi as abi.Function.Definition)
  //   const encodedProposalData = proposalAbiInstance.encode([contractsAbi, targets, values, callData, description])

  //TODO: Is values correct here ? The entire function was built considering that values are the parameters of the functions to call
  // and not the values to send to the propose method
  const clause = thor.account(GOVERNANCE_CONTRACT).method(proposalAbi).asClause(targets, [0], callData, description)

  return {
    ...clause,
    comment: `Create proposal to ${targets} with values ${values} and callData ${callData}`,
    abi: proposalAbi,
  }
}
